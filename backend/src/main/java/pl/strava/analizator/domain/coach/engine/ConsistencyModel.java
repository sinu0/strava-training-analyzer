package pl.strava.analizator.domain.coach.engine;

import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.ConsistencyReport;

public class ConsistencyModel {

    public ConsistencyReport evaluate(AthleteContext context) {
        int completed = context.getCompletedRecentSessions();
        int expected = Math.max(1, context.getExpectedRecentSessions());
        double ratio = (double) completed / expected;

        double gainMultiplier = computeGainMultiplier(ratio);

        String status;
        if (ratio >= 0.9) status = "EXCELLENT";
        else if (ratio >= 0.8) status = "GOOD";
        else if (ratio >= 0.6) status = "FAIR";
        else if (ratio >= 0.4) status = "POOR";
        else status = "CRITICAL";

        String recommendation;
        if (ratio >= 0.9) {
            recommendation = "Consistency is excellent — maintain current rhythm";
        } else if (ratio >= 0.8) {
            recommendation = "Good consistency — minor tweaks to schedule may help";
        } else if (ratio >= 0.6) {
            recommendation = "Consistency is slipping — prioritize shorter sessions to rebuild habit";
        } else if (ratio >= 0.4) {
            recommendation = "Poor consistency — reduce volume, focus on ride frequency";
        } else {
            recommendation = "Training consistency is critical — restart with very short sessions";
        }

        return ConsistencyReport.builder()
                .completionRatio(ratio)
                .completedSessions(completed)
                .expectedSessions(expected)
                .gainMultiplier(gainMultiplier)
                .status(status)
                .recommendation(recommendation)
                .build();
    }

    private double computeGainMultiplier(double ratio) {
        if (ratio >= 0.9) return 1.0;
        if (ratio >= 0.8) return 0.9;
        if (ratio >= 0.6) return 0.7;
        if (ratio >= 0.4) return 0.5;
        return 0.3;
    }
}
