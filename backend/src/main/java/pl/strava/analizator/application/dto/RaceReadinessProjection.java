package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.List;

public record RaceReadinessProjection(
        LocalDate raceDate,
        int daysUntilRace,
        double currentCtl,
        double currentAtl,
        double currentTsb,
        double projectedCtl,
        double projectedTsb,
        String formAssessment,
        String taperRecommendation,
        List<DailyProjection> projections
) {
    public record DailyProjection(
            LocalDate date,
            double ctl,
            double atl,
            double tsb
    ) {}
}
