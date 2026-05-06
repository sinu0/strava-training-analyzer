package pl.strava.analizator.domain.coach.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import pl.strava.analizator.domain.coach.model.AiInputModifiers;
import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.ConsistencyReport;
import pl.strava.analizator.domain.coach.model.FatigueCost;
import pl.strava.analizator.domain.coach.model.Goal;
import pl.strava.analizator.domain.coach.model.OverrideState;
import pl.strava.analizator.domain.coach.model.RiskPenalty;
import pl.strava.analizator.domain.coach.model.SessionImpactResult;
import pl.strava.analizator.domain.coach.model.SessionOption;
import pl.strava.analizator.domain.coach.model.TrajectoryPhase;

public class AdaptiveScoringEngine {

    private final SessionImpactModel sessionImpactModel;
    private final FatigueModel fatigueModel;
    private final RiskModel riskModel;
    private final ConsistencyModel consistencyModel;

    public AdaptiveScoringEngine() {
        this.sessionImpactModel = new SessionImpactModel();
        this.fatigueModel = new FatigueModel();
        this.riskModel = new RiskModel();
        this.consistencyModel = new ConsistencyModel();
    }

    public List<SessionOption> scoreSessions(
            List<String> sessionTypes,
            int baseDurationMinutes,
            double baseTss,
            Goal goal,
            TrajectoryPhase phase,
            AthleteContext context,
            OverrideState overrideState,
            AiInputModifiers aiModifiers,
            ConsistencyReport consistency) {

        double intensityBias = computeIntensityBias(overrideState, aiModifiers);
        double fatigueSensitivity = computeFatigueSensitivity(overrideState, aiModifiers);
        double riskSensitivity = computeRiskSensitivity(overrideState, aiModifiers);
        double adjustedReadiness = context.getReadinessScore() + aiModifiers.getReadinessAdjustment();

        AthleteContext adjustedContext = AthleteContext.builder()
                .ctl(context.getCtl())
                .atl(context.getAtl())
                .tsb(context.getTsb())
                .trainingMonotony(context.getTrainingMonotony())
                .readinessScore(Math.max(0, Math.min(100, adjustedReadiness)))
                .hrvRmssd(context.getHrvRmssd())
                .baselineHrv(context.getBaselineHrv())
                .restingHr(context.getRestingHr())
                .baselineRestingHr(context.getBaselineRestingHr())
                .sleepScore(context.getSleepScore())
                .bodyBattery(context.getBodyBattery())
                .stressAvg(context.getStressAvg())
                .timeAvailableMinutes(context.getTimeAvailableMinutes())
                .weatherScore(context.getWeatherScore())
                .weatherDescription(context.getWeatherDescription())
                .recentSessionOutcomes(context.getRecentSessionOutcomes())
                .metricValues(context.getMetricValues())
                .hasHrvData(context.isHasHrvData())
                .hasWeatherData(context.isHasWeatherData())
                .hasRecentActivities(context.isHasRecentActivities())
                .completedRecentSessions(context.getCompletedRecentSessions())
                .expectedRecentSessions(context.getExpectedRecentSessions())
                .build();

        List<SessionOption> options = new ArrayList<>();

        for (String sessionType : sessionTypes) {
            int duration = applyDurationModifiers(baseDurationMinutes, sessionType, aiModifiers, adjustedContext);
            double tss = applyTssModifiers(baseTss, sessionType, adjustedContext);

            SessionImpactResult impact = sessionImpactModel.compute(
                    sessionType, goal.getGoalType(), phase,
                    null);

            FatigueCost fatigue = fatigueModel.compute(tss, adjustedContext);
            RiskPenalty risk = riskModel.compute(sessionType, adjustedContext);

            double goalGain = impact.getGoalProgressGain();
            double unityGoalGain = goalGain / 100.0;

            double fatigueTerm = fatigue.getTotalCost() * fatigueSensitivity * 0.5;
            double riskTerm = risk.getPenaltyScore() / 100.0 * riskSensitivity * 0.5;

            double preferenceBonus = computePreferenceBonus(sessionType, aiModifiers);

            double score = unityGoalGain * intensityBias * 1.2
                    - fatigueTerm
                    - riskTerm
                    + preferenceBonus;

            score *= consistency.getGainMultiplier();
            score = Math.max(0, score);

            Map<String, Double> breakdown = new LinkedHashMap<>();
            breakdown.put("goal_gain", round2(unityGoalGain * intensityBias));
            breakdown.put("fatigue_cost", round2(fatigueTerm));
            breakdown.put("risk_penalty", round2(riskTerm));
            breakdown.put("preference_bonus", round2(preferenceBonus));
            breakdown.put("consistency_multiplier", round2(consistency.getGainMultiplier()));
            breakdown.put("final_score", round2(score));

            options.add(SessionOption.builder()
                    .type(sessionType)
                    .durationMinutes(duration)
                    .targetTss(tss)
                    .intensityFactor(computeIntensityFactor(sessionType))
                    .difficulty(determineDifficulty(sessionType))
                    .description(buildDescription(sessionType, duration, tss))
                    .indoor(shouldBeIndoor(adjustedContext))
                    .score(score)
                    .scoreBreakdown(breakdown)
                    .build());
        }

        options.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        return options;
    }

    private double computeIntensityBias(OverrideState override, AiInputModifiers ai) {
        double bias = ai.getIntensityBias();
        if (override == OverrideState.HIGH_LOAD) bias = Math.max(bias, 1.3);
        else if (override == OverrideState.INTENT) bias = Math.max(bias, 1.2);
        else if (override == OverrideState.LOW_LOAD) bias = Math.min(bias, 0.7);
        return Math.max(0.3, Math.min(2.0, bias));
    }

    private double computeFatigueSensitivity(OverrideState override, AiInputModifiers ai) {
        double sensitivity = ai.getFatigueSensitivity();
        if (override == OverrideState.LOW_LOAD) sensitivity = Math.max(sensitivity, 1.5);
        else if (override == OverrideState.HIGH_LOAD) sensitivity = Math.min(sensitivity, 0.7);
        return Math.max(0.3, Math.min(2.5, sensitivity));
    }

    private double computeRiskSensitivity(OverrideState override, AiInputModifiers ai) {
        if (override == OverrideState.HIGH_LOAD) return 0.5;
        if (override == OverrideState.INTENT) return 0.7;
        if (override == OverrideState.LOW_LOAD) return 1.5;
        return 1.0;
    }

    private int applyDurationModifiers(int base, String sessionType,
                                        AiInputModifiers ai, AthleteContext ctx) {
        int duration = base;

        switch (sessionType.toUpperCase()) {
            case "RECOVERY":
                duration = Math.min(duration, 60);
                break;
            case "VO2MAX":
            case "ANAEROBIC":
                duration = Math.min(duration, 90);
                break;
            case "THRESHOLD":
                duration = Math.min(duration, 120);
                break;
        }

        if (ai.getMaxDurationMinutes() != null && ai.getMaxDurationMinutes() < duration) {
            duration = ai.getMaxDurationMinutes();
        }

        if (ctx.getTimeAvailableMinutes() > 0 && ctx.getTimeAvailableMinutes() < duration) {
            duration = ctx.getTimeAvailableMinutes();
        }

        return Math.max(20, duration);
    }

    private double applyTssModifiers(double base, String sessionType, AthleteContext ctx) {
        double tss = base;

        double factor = switch (sessionType.toUpperCase()) {
            case "RECOVERY" -> 0.3;
            case "ENDURANCE" -> 0.8;
            case "TEMPO" -> 1.0;
            case "SWEET_SPOT" -> 1.1;
            case "THRESHOLD" -> 1.2;
            case "VO2MAX" -> 1.15;
            case "ANAEROBIC" -> 1.0;
            default -> 0.8;
        };

        return tss * factor;
    }

    private double computeIntensityFactor(String sessionType) {
        return switch (sessionType.toUpperCase()) {
            case "RECOVERY" -> 0.55;
            case "ENDURANCE" -> 0.70;
            case "TEMPO" -> 0.80;
            case "SWEET_SPOT" -> 0.88;
            case "THRESHOLD" -> 0.95;
            case "VO2MAX" -> 1.05;
            case "ANAEROBIC" -> 1.15;
            default -> 0.75;
        };
    }

    private String determineDifficulty(String sessionType) {
        return switch (sessionType.toUpperCase()) {
            case "RECOVERY" -> "EASY";
            case "ENDURANCE" -> "MODERATE";
            case "TEMPO" -> "MODERATE";
            case "SWEET_SPOT" -> "HARD";
            case "THRESHOLD" -> "HARD";
            case "VO2MAX" -> "VERY_HARD";
            case "ANAEROBIC" -> "MAXIMAL";
            default -> "MODERATE";
        };
    }

    private String buildDescription(String type, int duration, double tss) {
        return switch (type.toUpperCase()) {
            case "RECOVERY" -> String.format("%dmin easy recovery spin — Z1 only, TSS ~%.0f", duration, tss);
            case "ENDURANCE" -> String.format("%dmin endurance ride — Z2 steady, TSS ~%.0f", duration, tss);
            case "TEMPO" -> String.format("%dmin tempo ride — Z3, TSS ~%.0f", duration, tss);
            case "SWEET_SPOT" -> String.format("%dmin sweet spot — Z3/Z4 border, TSS ~%.0f", duration, tss);
            case "THRESHOLD" -> String.format("%dmin threshold session — Z4, TSS ~%.0f", duration, tss);
            case "VO2MAX" -> String.format("%dmin VO2max intervals — Z5, TSS ~%.0f", duration, tss);
            case "ANAEROBIC" -> String.format("%dmin anaerobic capacity — Z6+, TSS ~%.0f", duration, tss);
            default -> String.format("%dmin ride — TSS ~%.0f", duration, tss);
        };
    }

    private boolean shouldBeIndoor(AthleteContext ctx) {
        return ctx.isHasWeatherData() && ctx.getWeatherScore() <= 30;
    }

    private double computePreferenceBonus(String sessionType, AiInputModifiers ai) {
        String preferred = ai.getPreferredType();
        if (preferred == null) return 0;

        String upper = sessionType.toUpperCase();
        String pref = preferred.toUpperCase();

        if (upper.equals(pref)) return 0.30;
        if (isCompatibleType(upper, pref)) return 0.15;
        if (isOppositeType(upper, pref)) return -0.20;

        return 0;
    }

    private boolean isCompatibleType(String sessionType, String preferred) {
        if ("THRESHOLD".equals(preferred)
                && ("SWEET_SPOT".equals(sessionType) || "VO2MAX".equals(sessionType))) return true;
        if ("VO2MAX".equals(preferred)
                && ("THRESHOLD".equals(sessionType) || "ANAEROBIC".equals(sessionType))) return true;
        if ("RECOVERY".equals(preferred)
                && "ENDURANCE".equals(sessionType)) return true;
        if ("ENDURANCE".equals(preferred)
                && ("TEMPO".equals(sessionType) || "RECOVERY".equals(sessionType))) return true;
        return false;
    }

    private boolean isOppositeType(String sessionType, String preferred) {
        if (("RECOVERY".equals(preferred) || "ENDURANCE".equals(preferred))
                && ("THRESHOLD".equals(sessionType) || "VO2MAX".equals(sessionType)
                    || "ANAEROBIC".equals(sessionType) || "SWEET_SPOT".equals(sessionType))) return true;
        if (("THRESHOLD".equals(preferred) || "VO2MAX".equals(preferred) || "ANAEROBIC".equals(preferred))
                && ("RECOVERY".equals(sessionType))) return true;
        return false;
    }

    private static double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
