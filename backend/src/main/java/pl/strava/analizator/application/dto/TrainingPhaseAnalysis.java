package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.List;

public record TrainingPhaseAnalysis(
        List<WeekPhase> phases,
        String currentPhase,
        String recommendation,
        int periodizationScore
) {
    public record WeekPhase(
            String weekLabel,
            LocalDate weekStart,
            String phase,
            double avgCtl,
            double avgAtl,
            double avgTsb,
            double totalTss,
            double avgIntensityFactor,
            int totalDurationMin
    ) {}
}
