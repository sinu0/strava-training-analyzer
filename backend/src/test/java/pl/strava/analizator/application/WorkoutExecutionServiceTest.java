package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.WorkoutExecutionEventRequest;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionEventRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;

@ExtendWith(MockitoExtension.class)
class WorkoutExecutionServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-03T18:00:00Z");
    @Mock WorkoutExecutionRepository executionRepository;
    @Mock WorkoutExecutionEventRepository eventRepository;
    @Mock TrainingPlanRepository planRepository;
    private WorkoutExecutionService service;

    @BeforeEach
    void setUp() {
        service = new WorkoutExecutionService(executionRepository, eventRepository, planRepository,
                Clock.fixed(NOW, ZoneOffset.UTC));
        org.mockito.Mockito.lenient().when(executionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        org.mockito.Mockito.lenient().when(eventRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        org.mockito.Mockito.lenient().when(eventRepository.nextSequence(any())).thenReturn(1);
    }

    @Test
    void startIsIdempotentAndPreservesNullThresholds() {
        UUID planId = UUID.randomUUID();
        AtomicReference<WorkoutExecution> stored = new AtomicReference<>();
        when(executionRepository.findByStartIdempotencyKey("start-1"))
                .thenAnswer(i -> Optional.ofNullable(stored.get()));
        when(executionRepository.findActive()).thenReturn(Optional.empty());
        when(planRepository.findById(planId)).thenReturn(Optional.of(plan(planId)));
        when(executionRepository.save(any())).thenAnswer(i -> {
            WorkoutExecution value = i.getArgument(0);
            stored.set(value);
            return value;
        });

        WorkoutExecution first = service.start(planId, "start-1", NOW, "ON_DEVICE");
        WorkoutExecution retry = service.start(planId, "start-1", NOW, "ON_DEVICE");

        assertThat(retry.getId()).isEqualTo(first.getId());
        assertThat(first.getStatus()).isEqualTo(WorkoutExecutionStatus.RUNNING);
        assertThat(first.getStepsSnapshot()).hasSize(2);
        assertThat(first.getLthrBpm()).isNull();
        assertThat(first.getMaxHrBpm()).isNull();
    }

    @Test
    void refusesSecondActiveExecution() {
        UUID planId = UUID.randomUUID();
        when(executionRepository.findByStartIdempotencyKey("start-2")).thenReturn(Optional.empty());
        when(executionRepository.findActive()).thenReturn(Optional.of(execution(planId, WorkoutExecutionStatus.PAUSED)));

        assertThatThrownBy(() -> service.start(planId, "start-2", NOW, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("już aktywne");
        verify(planRepository, never()).findById(any());
    }

    @Test
    void checkpointRestoresElapsedStateAfterBackendRestart() {
        UUID planId = UUID.randomUUID();
        WorkoutExecution persisted = execution(planId, WorkoutExecutionStatus.RUNNING).toBuilder()
                .runningSince(NOW.minusSeconds(75)).build();
        when(executionRepository.findActive()).thenReturn(Optional.of(persisted));

        WorkoutExecution restored = service.active();

        assertThat(restored.getCurrentStepIndex()).isEqualTo(1);
        assertThat(restored.getWorkoutElapsedMs()).isEqualTo(75_000);
        assertThat(restored.getStepElapsedMs()).isEqualTo(15_000);
    }

    @Test
    void finishIsIdempotentAndUpdatesPlanOnce() {
        UUID planId = UUID.randomUUID();
        WorkoutExecution running = execution(planId, WorkoutExecutionStatus.RUNNING);
        AtomicReference<WorkoutExecution> finished = new AtomicReference<>();
        when(executionRepository.findByFinishIdempotencyKey("finish-1"))
                .thenAnswer(i -> Optional.ofNullable(finished.get()));
        when(executionRepository.findById(running.getId())).thenReturn(Optional.of(running));
        when(executionRepository.save(any())).thenAnswer(i -> {
            WorkoutExecution value = i.getArgument(0);
            finished.set(value);
            return value;
        });

        WorkoutExecution first = service.finish(running.getId(), "finish-1", NOW, false);
        WorkoutExecution retry = service.finish(running.getId(), "finish-1", NOW, false);

        assertThat(retry.getId()).isEqualTo(first.getId());
        assertThat(first.getStatus()).isEqualTo(WorkoutExecutionStatus.COMPLETED);
        verify(planRepository).updateStatus(planId, TrainingPlanStatus.COMPLETED);
    }

    @Test
    void eventIdempotencyDoesNotApplyIntensityTwice() {
        WorkoutExecution running = execution(UUID.randomUUID(), WorkoutExecutionStatus.RUNNING);
        when(executionRepository.findById(running.getId())).thenReturn(Optional.of(running));
        WorkoutExecutionEventRequest request = new WorkoutExecutionEventRequest();
        request.setType("INTENSITY");
        request.setIntensityDeltaPct(5);
        request.setIdempotencyKey("event-1");
        request.setOccurredAt(NOW);

        WorkoutExecution first = service.applyEvent(running.getId(), request);
        when(eventRepository.findByExecutionIdAndIdempotencyKey(running.getId(), "event-1"))
                .thenReturn(Optional.of(pl.strava.analizator.domain.model.WorkoutExecutionEvent.builder().build()));
        when(executionRepository.findById(running.getId())).thenReturn(Optional.of(first));
        WorkoutExecution retry = service.applyEvent(running.getId(), request);

        assertThat(first.getIntensityAdjustmentPct()).isEqualTo(5);
        assertThat(retry.getIntensityAdjustmentPct()).isEqualTo(5);
    }

    private TrainingPlan plan(UUID id) {
        return TrainingPlan.builder().id(id).date(LocalDate.of(2026, 9, 3))
                .plannedDescription("2 x próg").workoutNameSnapshot("2 x próg")
                .workoutTemplateRevision(4).ftpWatts(280)
                .workoutStepsSnapshot(List.of(WorkoutStep.builder().type("interval").repeat(1)
                        .onDurationSec(60).onPowerPctFtpLow(100).onPowerPctFtpHigh(105)
                        .offDurationSec(60).offPowerPctFtpLow(45).offPowerPctFtpHigh(55).build()))
                .status(TrainingPlanStatus.PLANNED).build();
    }

    private WorkoutExecution execution(UUID planId, WorkoutExecutionStatus status) {
        return WorkoutExecution.builder().id(UUID.randomUUID()).scheduledWorkoutId(planId)
                .workoutNameSnapshot("Test").stepsSnapshot(List.of(
                        WorkoutStep.builder().type("steady").durationSec(60).build(),
                        WorkoutStep.builder().type("steady").durationSec(60).build()))
                .startedAt(NOW.minusSeconds(75)).status(status).currentStepIndex(0)
                .workoutElapsedMs(0).stepElapsedMs(0)
                .runningSince(status == WorkoutExecutionStatus.RUNNING ? NOW : null)
                .skippedStepIndexes(List.of()).repeatedStepIndexes(List.of())
                .startIdempotencyKey("existing").activityMatchStatus("PENDING")
                .complianceStatus("UNKNOWN").complianceAlgorithmVersion("workout-compliance-v1")
                .deliveryMethod("ON_DEVICE").createdAt(NOW).updatedAt(NOW).build();
    }
}
