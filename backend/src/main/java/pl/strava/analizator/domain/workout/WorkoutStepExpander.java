package pl.strava.analizator.domain.workout;

import java.util.ArrayList;
import java.util.List;

import pl.strava.analizator.domain.model.WorkoutStep;

public final class WorkoutStepExpander {
    private WorkoutStepExpander() {
    }

    public static List<WorkoutStep> expand(List<WorkoutStep> source) {
        if (source == null) {
            return List.of();
        }
        List<WorkoutStep> result = new ArrayList<>();
        for (WorkoutStep step : source) {
            if (!"interval".equalsIgnoreCase(step.getType())) {
                result.add(step);
                continue;
            }
            int repeats = Math.max(1, step.getRepeat() != null ? step.getRepeat() : 1);
            for (int repeat = 0; repeat < repeats; repeat++) {
                result.add(WorkoutStep.builder()
                        .type("intervalOn").name(step.getName() != null ? step.getName() : "Interwał")
                        .instructions(step.getInstructions()).durationType("TIME")
                        .durationSec(step.getOnDurationSec())
                        .powerPctFtpLow(step.getOnPowerPctFtpLow()).powerPctFtpHigh(step.getOnPowerPctFtpHigh())
                        .heartRateBpmLow(step.getOnHeartRateBpmLow()).heartRateBpmHigh(step.getOnHeartRateBpmHigh())
                        .cadenceRpmLow(step.getOnCadenceRpmLow()).cadenceRpmHigh(step.getOnCadenceRpmHigh())
                        .build());
                if (step.getOffDurationSec() != null && step.getOffDurationSec() > 0) {
                    result.add(WorkoutStep.builder()
                            .type("recovery").name("Odpoczynek").durationType("TIME")
                            .durationSec(step.getOffDurationSec())
                            .powerPctFtpLow(step.getOffPowerPctFtpLow()).powerPctFtpHigh(step.getOffPowerPctFtpHigh())
                            .heartRateBpmLow(step.getOffHeartRateBpmLow()).heartRateBpmHigh(step.getOffHeartRateBpmHigh())
                            .cadenceRpmLow(step.getOffCadenceRpmLow()).cadenceRpmHigh(step.getOffCadenceRpmHigh())
                            .build());
                }
            }
        }
        return List.copyOf(result);
    }
}
