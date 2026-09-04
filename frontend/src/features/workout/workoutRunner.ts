import type { WorkoutExecution, WorkoutStep } from '@/types/training';

export type RunnerAction =
  | { type: 'RECONCILE'; nowMs: number }
  | { type: 'PAUSE'; nowMs: number }
  | { type: 'RESUME'; nowMs: number }
  | { type: 'SKIP'; nowMs: number }
  | { type: 'PREVIOUS'; nowMs: number }
  | { type: 'INTENSITY'; nowMs: number; deltaPct: number }
  | { type: 'COMPLETE'; nowMs: number }
  | { type: 'ABORT'; nowMs: number };

function durationMs(step: WorkoutStep): number | null {
  if (step.durationSec == null || step.durationType === 'OPEN' || step.durationType === 'LAP_BUTTON') {
    return null;
  }
  return Math.max(0, step.durationSec * 1000);
}

function versioned(state: WorkoutExecution, nowMs: number): WorkoutExecution {
  return { ...state, stateVersion: state.stateVersion + 1, updatedAt: new Date(nowMs).toISOString() };
}

export function reconcileWorkout(state: WorkoutExecution, nowMs: number): WorkoutExecution {
  if (state.status !== 'RUNNING' || state.runningSince == null) return state;
  let available = Math.max(0, nowMs - Date.parse(state.runningSince));
  if (available === 0) return state;
  let stepIndex = state.currentStepIndex;
  let stepElapsed = state.stepElapsedMs;
  let workoutElapsed = state.workoutElapsedMs;
  let cursor = Date.parse(state.runningSince);

  while (available > 0 && stepIndex < state.stepsSnapshot.length) {
    const currentStep = state.stepsSnapshot[stepIndex];
    if (!currentStep) break;
    const stepDuration = durationMs(currentStep);
    if (stepDuration == null) {
      stepElapsed += available;
      workoutElapsed += available;
      cursor += available;
      available = 0;
      break;
    }
    const remaining = Math.max(0, stepDuration - stepElapsed);
    const consumed = Math.min(available, remaining);
    stepElapsed += consumed;
    workoutElapsed += consumed;
    cursor += consumed;
    available -= consumed;
    if (stepElapsed >= stepDuration) {
      stepIndex += 1;
      stepElapsed = 0;
    }
  }

  if (stepIndex >= state.stepsSnapshot.length) {
    const last = state.stepsSnapshot[state.stepsSnapshot.length - 1];
    return versioned({
      ...state,
      status: 'COMPLETED',
      currentStepIndex: Math.max(0, state.stepsSnapshot.length - 1),
      stepElapsedMs: last ? (durationMs(last) ?? stepElapsed) : 0,
      workoutElapsedMs: workoutElapsed,
      runningSince: null,
      finishedAt: new Date(cursor).toISOString(),
    }, cursor);
  }
  return versioned({
    ...state,
    currentStepIndex: stepIndex,
    stepElapsedMs: stepElapsed,
    workoutElapsedMs: workoutElapsed,
    runningSince: new Date(nowMs).toISOString(),
  }, nowMs);
}

export function workoutReducer(state: WorkoutExecution, action: RunnerAction): WorkoutExecution {
  const reconciled = action.type === 'RESUME' ? state : reconcileWorkout(state, action.nowMs);
  const now = new Date(action.nowMs).toISOString();
  switch (action.type) {
    case 'RECONCILE':
      return reconciled;
    case 'PAUSE':
      if (reconciled.status === 'COMPLETED') return reconciled;
      if (reconciled.status !== 'RUNNING') throw new Error('Pauza jest dostępna tylko podczas treningu');
      return versioned({ ...reconciled, status: 'PAUSED', runningSince: null }, action.nowMs);
    case 'RESUME':
      if (state.status !== 'PAUSED') throw new Error('Można wznowić tylko wstrzymany trening');
      return versioned({ ...state, status: 'RUNNING', runningSince: now }, action.nowMs);
    case 'SKIP': {
      if (reconciled.status !== 'RUNNING' && reconciled.status !== 'PAUSED') throw new Error('Trening nie jest aktywny');
      const skipped = [...reconciled.skippedStepIndexes, reconciled.currentStepIndex];
      if (reconciled.currentStepIndex + 1 >= reconciled.stepsSnapshot.length) {
        return versioned({ ...reconciled, status: 'COMPLETED', finishedAt: now, runningSince: null, skippedStepIndexes: skipped }, action.nowMs);
      }
      return versioned({ ...reconciled, currentStepIndex: reconciled.currentStepIndex + 1, stepElapsedMs: 0, skippedStepIndexes: skipped, runningSince: reconciled.status === 'RUNNING' ? now : null }, action.nowMs);
    }
    case 'PREVIOUS': {
      if (reconciled.status !== 'RUNNING' && reconciled.status !== 'PAUSED') throw new Error('Trening nie jest aktywny');
      const previous = Math.max(0, reconciled.currentStepIndex - 1);
      return versioned({ ...reconciled, currentStepIndex: previous, stepElapsedMs: 0, repeatedStepIndexes: [...reconciled.repeatedStepIndexes, previous], runningSince: reconciled.status === 'RUNNING' ? now : null }, action.nowMs);
    }
    case 'INTENSITY':
      return versioned({ ...reconciled, intensityAdjustmentPct: Math.max(-50, Math.min(50, reconciled.intensityAdjustmentPct + action.deltaPct)), runningSince: reconciled.status === 'RUNNING' ? now : null }, action.nowMs);
    case 'COMPLETE':
      return versioned({ ...reconciled, status: 'COMPLETED', finishedAt: now, runningSince: null }, action.nowMs);
    case 'ABORT':
      if (reconciled.status === 'COMPLETED') throw new Error('Ukończonego treningu nie można przerwać');
      return versioned({ ...reconciled, status: 'ABORTED', finishedAt: now, runningSince: null }, action.nowMs);
  }
}

export function createMonotonicClock(
  wallNow: () => number = Date.now,
  monotonicNow: () => number = () => performance.now(),
) {
  const wallOrigin = wallNow();
  const monotonicOrigin = monotonicNow();
  return () => wallOrigin + Math.max(0, monotonicNow() - monotonicOrigin);
}

export function totalWorkoutDurationMs(steps: WorkoutStep[]): number {
  return steps.reduce((total, step) => total + (durationMs(step) ?? 0), 0);
}
