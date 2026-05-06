package pl.strava.analizator.domain.coach.engine;

import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.RiskPenalty;

public class RiskModel {

    private static final double TSB_CRITICAL = -40.0;
    private static final double TSB_HIGH_RISK = -25.0;
    private static final double TSB_MODERATE_RISK = -15.0;
    private static final double READINESS_CRITICAL = 25.0;
    private static final double READINESS_HIGH_RISK = 40.0;
    private static final double ATL_CTL_CRITICAL = 1.5;
    private static final double MONOTONY_HIGH = 2.5;
    private static final double HRV_DECLINE_THRESHOLD = 0.85;

    public RiskPenalty compute(String sessionType, AthleteContext context) {
        double overtrainingProbability = computeOvertrainingProbability(context);
        double failureProbability = computeFailureProbability(sessionType, context);

        double penaltyScore = (overtrainingProbability * 40.0 + failureProbability * 60.0);

        String riskLevel;
        if (penaltyScore > 70) riskLevel = "CRITICAL";
        else if (penaltyScore > 45) riskLevel = "HIGH";
        else if (penaltyScore > 20) riskLevel = "MODERATE";
        else riskLevel = "LOW";

        String primaryRisk = determinePrimaryRisk(context, overtrainingProbability, failureProbability);

        return RiskPenalty.builder()
                .penaltyScore(Math.min(100.0, penaltyScore))
                .riskLevel(riskLevel)
                .overtrainingProbability(overtrainingProbability)
                .failureProbability(failureProbability)
                .primaryRisk(primaryRisk)
                .build();
    }

    private double computeOvertrainingProbability(AthleteContext context) {
        double probability = 0.0;
        int signals = 0;
        int totalSignals = 5;

        if (context.getTsb() <= TSB_CRITICAL) {
            probability += 0.4;
            signals++;
        } else if (context.getTsb() <= TSB_HIGH_RISK) {
            probability += 0.25;
            signals++;
        } else if (context.getTsb() <= TSB_MODERATE_RISK) {
            probability += 0.1;
        }

        if (context.getAtl() > 0 && context.getCtl() > 0
                && context.getAtl() / context.getCtl() >= ATL_CTL_CRITICAL) {
            probability += 0.2;
            signals++;
        }

        if (context.getReadinessScore() <= READINESS_CRITICAL) {
            probability += 0.25;
            signals++;
        } else if (context.getReadinessScore() <= READINESS_HIGH_RISK) {
            probability += 0.15;
        }

        if (context.getTrainingMonotony() >= MONOTONY_HIGH) {
            probability += 0.1;
            signals++;
        }

        if (context.isHasHrvData() && context.getHrvRmssd() > 0
                && context.getBaselineHrv() > 0
                && context.getHrvRmssd() / context.getBaselineHrv() < HRV_DECLINE_THRESHOLD) {
            probability += 0.15;
            signals++;
        }

        return Math.min(1.0, probability);
    }

    private double computeFailureProbability(String sessionType, AthleteContext context) {
        double probability = 0.0;

        boolean isHighIntensity = "VO2MAX".equalsIgnoreCase(sessionType)
                || "THRESHOLD".equalsIgnoreCase(sessionType)
                || "ANAEROBIC".equalsIgnoreCase(sessionType)
                || "SWEET_SPOT".equalsIgnoreCase(sessionType);

        if (isHighIntensity && context.getTsb() < -15) {
            probability += 0.35;
        } else if (isHighIntensity && context.getTsb() < -5) {
            probability += 0.15;
        }

        if (context.getReadinessScore() < 30) {
            probability += 0.3;
        } else if (context.getReadinessScore() < 50) {
            probability += 0.15;
        }

        if (context.getSleepScore() > 0 && context.getSleepScore() < 40) {
            probability += 0.15;
        }

        if (context.getRecentSessionOutcomes() != null) {
            long failedCount = context.getRecentSessionOutcomes().stream()
                    .filter(o -> o != null && (o.contains("FAIL") || o.contains("MISSED")))
                    .count();
            if (failedCount >= 3) {
                probability += 0.3;
            } else if (failedCount >= 1) {
                probability += 0.1;
            }
        }

        return Math.min(1.0, probability);
    }

    private String determinePrimaryRisk(AthleteContext context,
                                         double overtrainingProb, double failureProb) {
        if (context.getTsb() <= TSB_CRITICAL) return "Extreme TSB depletion — overtraining imminent";
        if (context.getTsb() <= TSB_HIGH_RISK) return "High fatigue accumulation";
        if (context.getReadinessScore() <= READINESS_CRITICAL) return "Critically low readiness";
        if (overtrainingProb > 0.6) return "Multiple overtraining signals";
        if (failureProb > 0.5) return "High probability of session failure";
        if (overtrainingProb > 0.3) return "Moderate overtraining risk";
        return "Low risk";
    }
}
