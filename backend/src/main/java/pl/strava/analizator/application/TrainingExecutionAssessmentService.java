package pl.strava.analizator.application;

import pl.strava.analizator.application.dto.CalendarActivitySummaryDto;
import pl.strava.analizator.application.dto.TrainingExecutionAssessmentDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.workout.WorkoutComplianceEvaluator;

/** One assessment for the calendar, weekly goals and execution summary. */
public class TrainingExecutionAssessmentService {
    private final WorkoutComplianceEvaluator evaluator = new WorkoutComplianceEvaluator();

    public TrainingExecutionAssessmentDto assess(TrainingPlan plan, Activity activity,
            CalendarActivitySummaryDto summary, Double tssCompliance, WorkoutExecution execution) {
        if (plan == null || summary == null) return null;
        Double duration = plan.getPlannedDurationMin() != null && plan.getPlannedDurationMin() > 0 && summary.getDurationMin() != null
                ? summary.getDurationMin() * 100.0 / plan.getPlannedDurationMin() : null;
        var compliance = evaluator.evaluate(plan.getWorkoutStepsSnapshot(), plan.getFtpWatts(), activity);
        Integer score = compliance.getScore();
        String availability = compliance.getAvailability();
        String reason = compliance.getReason();
        if (execution != null && activity != null && activity.getId().equals(execution.getActivityId())) {
            boolean currentAlgorithm = WorkoutComplianceEvaluator.VERSION.equals(execution.getComplianceAlgorithmVersion());
            score = currentAlgorithm ? execution.getComplianceScore() : null;
            availability = !currentAlgorithm ? "UNKNOWN" : "COMPLETE".equals(execution.getComplianceStatus()) ? "AVAILABLE" : execution.getComplianceStatus();
            reason = !currentAlgorithm ? "Wynik legacy wymaga ponownej oceny bieżącym algorytmem."
                    : score == null ? "Ocena wykonania jest niedostępna dla tego nagrania." : "Wspólna ocena zapisanego wykonania.";
        }
        String outcome = score == null ? "UNKNOWN" : score >= 85 ? "WELL_EXECUTED" : "PARTIAL";
        String label = score == null ? "Brak pełnej oceny" : score >= 85 ? "Trafiony bodziec" : "Częściowo trafiony";
        // Aggregate overshoot is an observation, not an invented interval score.
        if ((tssCompliance != null && tssCompliance >= 120) || (duration != null && duration >= 125)) {
            outcome = "TOO_HARD";
            label = "Ponad plan";
        }
        return TrainingExecutionAssessmentDto.builder().outcome(outcome).label(label).description(reason)
                .availability(availability).algorithmVersion(WorkoutComplianceEvaluator.VERSION).score(score)
                .tssCompliance(tssCompliance).durationCompliance(duration)
                .intervalCompliance(score != null ? score.doubleValue() : null).zoneCompliance(score != null ? score.doubleValue() : null)
                .stimulusMatch(score != null && score >= 85)
                .primaryLimiter(score == null ? "UNKNOWN" : score >= 85 ? "ON_TARGET" : "EXECUTION")
                .nextDayAdvice(score == null ? "Nie wyciągaj wniosków o intensywności z brakujących danych. Uzupełnij odczucia."
                        : "Uwzględnij ocenę i aktualną regenerację przy następnej sesji.").build();
    }
}
