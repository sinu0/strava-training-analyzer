package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Pure domain engine that produces a {@link DailyDecision} from athlete state signals.
 * Zero framework dependencies — evaluation follows strict priority order:
 * <ol>
 *   <li>SAFETY (fatigue, HRV)</li>
 *   <li>ADAPTATION (response effectiveness)</li>
 *   <li>PLAN (scheduled workout)</li>
 *   <li>CONTEXT (weather, time)</li>
 * </ol>
 */
public class DailyDecisionEngine {

    // --- Safety thresholds ---
    private static final double TSB_CRITICAL = -40.0;
    private static final double TSB_HIGH_FATIGUE = -20.0;
    private static final double TSB_MODERATE_FATIGUE = -10.0;
    private static final double READINESS_CRITICAL = 25.0;
    private static final double READINESS_LOW = 45.0;
    private static final double READINESS_MODERATE = 60.0;
    private static final double ATL_CTL_RATIO_CRITICAL = 1.5;
    private static final double ATL_CTL_RATIO_HIGH = 1.3;
    private static final double MONOTONY_HIGH = 2.5;

    // --- Weather thresholds ---
    private static final int WEATHER_BAD = 30;
    private static final int WEATHER_MARGINAL = 50;

    // --- Time thresholds ---
    private static final double TIME_SHORTAGE_RATIO = 0.6;

    // --- Confidence weights ---
    private static final double WEIGHT_DATA_COMPLETENESS = 0.4;
    private static final double WEIGHT_SIGNAL_AGREEMENT = 0.35;
    private static final double WEIGHT_STABILITY = 0.25;

    public DailyDecision evaluate(DecisionInput input) {
        List<DecisionReason> reasons = new ArrayList<>();

        // --- Priority 1: SAFETY ---
        SafetyResult safety = assessSafety(input);
        reasons.addAll(safety.reasons);

        if (safety.skip) {
            return buildSkipDecision(reasons, safety);
        }

        // --- Priority 2: ADAPTATION ---
        AdaptationResult adaptation = assessAdaptation(input);
        reasons.addAll(adaptation.reasons);

        // --- Priority 3: PLAN ---
        PlanResult plan = assessPlan(input);
        reasons.addAll(plan.reasons);

        // --- Priority 4: CONTEXT ---
        ContextResult context = assessContext(input);
        reasons.addAll(context.reasons);

        // --- Determine final decision ---
        DecisionType decision = resolveDecision(safety, adaptation, plan, context, input);
        WorkoutSuggestion workout = resolveWorkout(decision, input, safety, context);

        // --- Risk ---
        RiskLevel risk = assessRisk(safety, input);

        // --- Confidence ---
        ConfidenceScore confidence = calculateConfidence(input, safety, adaptation, plan, context);

        // --- Alternatives ---
        List<AlternativeOption> alternatives = generateAlternatives(decision, workout, input, context);

        return DailyDecision.builder()
                .decision(decision)
                .workout(workout)
                .confidence(confidence)
                .risk(risk)
                .reasons(reasons)
                .alternatives(alternatives)
                .build();
    }

    // ─── SAFETY ────────────────────────────────────────────────────

    private SafetyResult assessSafety(DecisionInput input) {
        SafetyResult result = new SafetyResult();
        double tsb = toDouble(input.tsb);
        double readiness = toDouble(input.readinessScore);
        double atl = toDouble(input.atl);
        double ctl = toDouble(input.ctl);
        double monotony = toDouble(input.trainingMonotony);
        String hrvTrend = input.hrvTrend != null ? input.hrvTrend.toUpperCase(Locale.ROOT) : "";
        double outcomeRatio = toDouble(input.recentOutcomeRatio, 0.7);

        int flags = 0;

        if (tsb <= TSB_CRITICAL) {
            result.reasons.add(reason("SAFETY", "TSB", "Extreme fatigue — TSB below -40", "TSB=" + tsb));
            flags += 3;
        } else if (tsb <= TSB_HIGH_FATIGUE) {
            result.reasons.add(reason("SAFETY", "TSB", "High fatigue — TSB below -20", "TSB=" + tsb));
            flags += 2;
        } else if (tsb <= TSB_MODERATE_FATIGUE) {
            result.reasons.add(reason("SAFETY", "TSB", "Moderate fatigue — TSB below -10", "TSB=" + tsb));
            flags += 1;
        }

        if (readiness <= READINESS_CRITICAL) {
            result.reasons.add(reason("SAFETY", "READINESS", "Critical readiness — score below 25", "readiness=" + readiness));
            flags += 3;
        } else if (readiness <= READINESS_LOW) {
            result.reasons.add(reason("SAFETY", "READINESS", "Low readiness — score below 45", "readiness=" + readiness));
            flags += 2;
        } else if (readiness <= READINESS_MODERATE) {
            result.reasons.add(reason("SAFETY", "READINESS", "Moderate readiness — score below 60", "readiness=" + readiness));
            flags += 1;
        }

        if (atl > 0 && ctl > 0) {
            double ratio = atl / ctl;
            if (ratio >= ATL_CTL_RATIO_CRITICAL) {
                result.reasons.add(reason("SAFETY", "ATL/CTL", "ATL/CTL ratio critically high", "ratio=" + round(ratio)));
                flags += 2;
            } else if (ratio >= ATL_CTL_RATIO_HIGH) {
                result.reasons.add(reason("SAFETY", "ATL/CTL", "ATL/CTL ratio elevated", "ratio=" + round(ratio)));
                flags += 1;
            }
        }

        if (hrvTrend.contains("DECLINING") || hrvTrend.contains("DEGRAD")) {
            result.reasons.add(reason("SAFETY", "HRV", "HRV trend declining — ANS fatigue", "hrvTrend=" + hrvTrend));
            flags += 2;
        }

        if (monotony >= MONOTONY_HIGH) {
            result.reasons.add(reason("SAFETY", "MONOTONY", "High training monotony — injury risk", "monotony=" + monotony));
            flags += 1;
        }

        if (outcomeRatio < 0.3) {
            result.reasons.add(reason("SAFETY", "OUTCOMES", "Recent workouts mostly failed", "outcomeRatio=" + outcomeRatio));
            flags += 2;
        } else if (outcomeRatio < 0.5) {
            result.reasons.add(reason("SAFETY", "OUTCOMES", "Recent outcomes below par", "outcomeRatio=" + outcomeRatio));
            flags += 1;
        }

        result.flags = flags;
        result.skip = flags >= 5;
        return result;
    }

    // ─── ADAPTATION ────────────────────────────────────────────────

    private AdaptationResult assessAdaptation(DecisionInput input) {
        AdaptationResult result = new AdaptationResult();
        double outcomeRatio = toDouble(input.recentOutcomeRatio, 0.7);

        if (outcomeRatio > 0.8) {
            result.reasons.add(reason("ADAPTATION", "OUTCOMES",
                    "Strong recent outcomes — athlete is adapting well", "outcomeRatio=" + outcomeRatio));
            result.effective = true;
        } else if (outcomeRatio < 0.4) {
            result.reasons.add(reason("ADAPTATION", "OUTCOMES",
                    "Poor recent outcomes — adaptation may be compromised", "outcomeRatio=" + outcomeRatio));
            result.effective = false;
        }

        return result;
    }

    // ─── PLAN ──────────────────────────────────────────────────────

    private PlanResult assessPlan(DecisionInput input) {
        PlanResult result = new PlanResult();

        if (input.plannedType == null && input.plannedTss == null) {
            result.reasons.add(reason("PLAN", "SCHEDULE",
                    "No workout planned for today — suggesting recovery or easy spin",
                    "planned=null"));
            result.hasPlan = false;
        } else {
            result.reasons.add(reason("PLAN", "SCHEDULE",
                    "Scheduled: " + input.plannedType + " (TSS " + input.plannedTss + ")",
                    "type=" + input.plannedType + ", tss=" + input.plannedTss));
            result.hasPlan = true;
        }

        return result;
    }

    // ─── CONTEXT ───────────────────────────────────────────────────

    private ContextResult assessContext(DecisionInput input) {
        ContextResult result = new ContextResult();

        if (input.weatherScore <= WEATHER_BAD) {
            result.reasons.add(reason("CONTEXT", "WEATHER",
                    "Bad weather: " + (input.weatherDescription != null ? input.weatherDescription : "score=" + input.weatherScore),
                    "weatherScore=" + input.weatherScore));
            result.badWeather = true;
        } else if (input.weatherScore <= WEATHER_MARGINAL) {
            result.reasons.add(reason("CONTEXT", "WEATHER",
                    "Marginal weather — may prefer indoor",
                    "weatherScore=" + input.weatherScore));
            result.marginalWeather = true;
        }

        if (input.timeAvailableMin != null && input.plannedDurationMin != null) {
            if (input.timeAvailableMin < input.plannedDurationMin * TIME_SHORTAGE_RATIO) {
                result.reasons.add(reason("CONTEXT", "TIME",
                        "Severe time shortage — only " + input.timeAvailableMin + "min available vs " + input.plannedDurationMin + "min planned",
                        "available=" + input.timeAvailableMin + ", planned=" + input.plannedDurationMin));
                result.severeTimeShortage = true;
            } else if (input.timeAvailableMin < input.plannedDurationMin) {
                result.reasons.add(reason("CONTEXT", "TIME",
                        "Limited time — " + input.timeAvailableMin + "min available vs " + input.plannedDurationMin + "min planned",
                        "available=" + input.timeAvailableMin + ", planned=" + input.plannedDurationMin));
                result.limitedTime = true;
            }
        }

        return result;
    }

    // ─── DECISION RESOLUTION ───────────────────────────────────────

    private DecisionType resolveDecision(SafetyResult safety, AdaptationResult adaptation,
                                         PlanResult plan, ContextResult context, DecisionInput input) {
        if (safety.skip) {
            return DecisionType.SKIP;
        }

        if (context.badWeather) {
            return DecisionType.INDOOR;
        }

        boolean needsModify = safety.flags >= 2
                || !adaptation.effective
                || !plan.hasPlan
                || context.severeTimeShortage;

        if (context.limitedTime || context.marginalWeather) {
            return DecisionType.MODIFY;
        }

        if (needsModify) {
            return DecisionType.MODIFY;
        }

        return DecisionType.RIDE;
    }

    // ─── WORKOUT RESOLUTION ────────────────────────────────────────

    private WorkoutSuggestion resolveWorkout(DecisionType decision, DecisionInput input,
                                             SafetyResult safety, ContextResult context) {
        int duration = input.plannedDurationMin != null ? input.plannedDurationMin : 60;
        int tss = input.plannedTss != null ? input.plannedTss.intValue() : 50;

        if (safety.skip || decision == DecisionType.SKIP) {
            return WorkoutSuggestion.builder()
                    .type("REST")
                    .durationMin(0)
                    .targetTss(0)
                    .difficulty("NONE")
                    .intensityDescription("No training today")
                    .description("Complete rest recommended due to fatigue signals")
                    .isIndoor(false)
                    .build();
        }

        if (decision == DecisionType.MODIFY) {
            double reductionFactor = 1.0;
            if (safety.flags >= 2) {
                reductionFactor = 0.4;
            } else if (context.severeTimeShortage) {
                reductionFactor = Math.min(0.5, (double) input.timeAvailableMin / duration);
            } else if (context.limitedTime) {
                reductionFactor = Math.min(0.75, (double) input.timeAvailableMin / duration);
            }

            int modTss = (int) Math.round(tss * reductionFactor);
            int modDuration = (int) Math.round(duration * reductionFactor);

            String modType = input.plannedType != null ? input.plannedType : "ENDURANCE";
            if (safety.flags >= 2) {
                modType = "RECOVERY";
            }

            return WorkoutSuggestion.builder()
                    .type(modType)
                    .durationMin(Math.max(20, modDuration))
                    .targetTss(Math.max(10, modTss))
                    .difficulty(determineDifficulty(safety))
                    .intensityDescription("Modified — reduced volume" + (safety.flags >= 2 ? " and intensity" : ""))
                    .description("Shortened session: " + modDuration + "min at moderate effort")
                    .isIndoor(false)
                    .build();
        }

        if (decision == DecisionType.INDOOR) {
            return WorkoutSuggestion.builder()
                    .type(input.plannedType != null ? input.plannedType : "ENDURANCE")
                    .durationMin(duration)
                    .targetTss(tss)
                    .difficulty("MODERATE")
                    .intensityDescription("Indoor session — as planned")
                    .description("Indoor workout — same structure, just inside")
                    .isIndoor(true)
                    .build();
        }

        return WorkoutSuggestion.builder()
                .type(input.plannedType != null ? input.plannedType : "ENDURANCE")
                .durationMin(duration)
                .targetTss(tss)
                .difficulty("MODERATE")
                .intensityDescription("Full workout as planned")
                .description(duration + "min " + (input.plannedType != null ? input.plannedType : "ride"))
                .isIndoor(false)
                .build();
    }

    private String determineDifficulty(SafetyResult safety) {
        if (safety.flags >= 2) return "EASY";
        return "MODERATE";
    }

    // ─── ALTERNATIVES ──────────────────────────────────────────────

    private List<AlternativeOption> generateAlternatives(DecisionType decision,
                                                          WorkoutSuggestion workout,
                                                          DecisionInput input,
                                                          ContextResult context) {
        List<AlternativeOption> alternatives = new ArrayList<>();

        int baseDuration = input.plannedDurationMin != null ? input.plannedDurationMin : 60;
        int baseTss = input.plannedTss != null ? input.plannedTss.intValue() : 50;

        String plannedType = input.plannedType != null ? input.plannedType : "ENDURANCE";

        if (decision != DecisionType.SKIP) {
            // Shorter version
            alternatives.add(AlternativeOption.builder()
                    .label("Shorter version")
                    .type(DecisionType.MODIFY)
                    .workout(WorkoutSuggestion.builder()
                            .type(plannedType)
                            .durationMin(Math.max(20, (int) (baseDuration * 0.5)))
                            .targetTss(Math.max(15, (int) (baseTss * 0.5)))
                            .difficulty("EASY")
                            .intensityDescription("Half duration, same intensity")
                            .description("Compact " + (int) (baseDuration * 0.5) + "min session")
                            .isIndoor(decision == DecisionType.INDOOR)
                            .build())
                    .rationale("Time-efficient version that preserves stimulus quality")
                    .build());

            // Easier version
            alternatives.add(AlternativeOption.builder()
                    .label("Easier version")
                    .type(DecisionType.MODIFY)
                    .workout(WorkoutSuggestion.builder()
                            .type("ENDURANCE")
                            .durationMin(baseDuration)
                            .targetTss(Math.max(20, (int) (baseTss * 0.7)))
                            .difficulty("EASY")
                            .intensityDescription("Reduced intensity, same duration")
                            .description("Easy endurance ride — " + baseDuration + "min at low intensity")
                            .isIndoor(decision == DecisionType.INDOOR)
                            .build())
                    .rationale("Lighter intensity while keeping time on the bike")
                    .build());
        }

        // Indoor option (if not already indoor)
        if (decision != DecisionType.INDOOR) {
            alternatives.add(AlternativeOption.builder()
                    .label("Indoor version")
                    .type(DecisionType.INDOOR)
                    .workout(WorkoutSuggestion.builder()
                            .type(plannedType)
                            .durationMin(baseDuration)
                            .targetTss(baseTss)
                            .difficulty("MODERATE")
                            .intensityDescription("Same session on trainer")
                            .description("Indoor " + baseDuration + "min on the trainer")
                            .isIndoor(true)
                            .build())
                    .rationale("Train inside — same session, controlled environment")
                    .build());
        }

        return alternatives;
    }

    // ─── SKIP DECISION BUILD ───────────────────────────────────────

    private DailyDecision buildSkipDecision(List<DecisionReason> reasons, SafetyResult safety) {
        return DailyDecision.builder()
                .decision(DecisionType.SKIP)
                .workout(WorkoutSuggestion.builder()
                        .type("REST")
                        .durationMin(0)
                        .targetTss(0)
                        .difficulty("NONE")
                        .intensityDescription("Rest day")
                        .description("Take a rest day. Recovery is training.")
                        .isIndoor(false)
                        .build())
                .confidence(ConfidenceScore.builder()
                        .score(safety.flags >= 8 ? 0.9 : 0.7)
                        .label(safety.flags >= 8 ? "HIGH" : "MEDIUM")
                        .description("Based on " + safety.flags + " safety flags")
                        .build())
                .risk(safety.flags >= 8 ? RiskLevel.CRITICAL : RiskLevel.HIGH)
                .reasons(reasons)
                .alternatives(List.of(
                        AlternativeOption.builder()
                                .label("Active recovery")
                                .type(DecisionType.MODIFY)
                                .workout(WorkoutSuggestion.builder()
                                        .type("RECOVERY")
                                        .durationMin(30)
                                        .targetTss(10)
                                        .difficulty("EASY")
                                        .intensityDescription("Very light spin")
                                        .description("30min easy spin at Zone 1")
                                        .isIndoor(false)
                                        .build())
                                .rationale("If you really want to ride, keep it easy")
                                .build(),
                        AlternativeOption.builder()
                                .label("Mobility work")
                                .type(DecisionType.MODIFY)
                                .workout(WorkoutSuggestion.builder()
                                        .type("MOBILITY")
                                        .durationMin(30)
                                        .targetTss(5)
                                        .difficulty("EASY")
                                        .intensityDescription("Stretching and mobility")
                                        .description("30min stretching, foam rolling, mobility drills")
                                        .isIndoor(true)
                                        .build())
                                .rationale("Active recovery without load")
                                .build()
                ))
                .build();
    }

    // ─── RISK ──────────────────────────────────────────────────────

    private RiskLevel assessRisk(SafetyResult safety, DecisionInput input) {
        if (safety.flags >= 8) return RiskLevel.CRITICAL;
        if (safety.flags >= 5) return RiskLevel.HIGH;
        if (safety.flags >= 2) return RiskLevel.MODERATE;
        return RiskLevel.LOW;
    }

    // ─── CONFIDENCE ────────────────────────────────────────────────

    private ConfidenceScore calculateConfidence(DecisionInput input,
                                                 SafetyResult safety,
                                                 AdaptationResult adaptation,
                                                 PlanResult plan,
                                                 ContextResult context) {
        double completeness = calculateDataCompleteness(input);
        double agreement = calculateSignalAgreement(safety, input);
        double stability = calculateStability(input);

        double score = WEIGHT_DATA_COMPLETENESS * completeness
                + WEIGHT_SIGNAL_AGREEMENT * agreement
                + WEIGHT_STABILITY * stability;

        score = Math.max(0.1, Math.min(1.0, score));
        String label = score >= 0.8 ? "VERY_HIGH" : score >= 0.6 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";

        return ConfidenceScore.builder()
                .score(round(score))
                .label(label)
                .description("Completeness: " + round(completeness)
                        + ", Agreement: " + round(agreement)
                        + ", Stability: " + round(stability))
                .build();
    }

    private double calculateDataCompleteness(DecisionInput input) {
        double points = 0;
        int total = 5;
        if (input.readinessScore != null) points++;
        if (input.tsb != null && input.ctl != null && input.atl != null) points++;
        if (input.hrvTrend != null && input.hasHrvData) points++;
        if (input.hasWeatherData) points++;
        if (input.hasRecentActivities) points++;
        return points / total;
    }

    private double calculateSignalAgreement(SafetyResult safety, DecisionInput input) {
        int signals = 0;
        int agreeing = 0;

        double tsb = toDouble(input.tsb);
        double readiness = toDouble(input.readinessScore);
        double outcomeRatio = toDouble(input.recentOutcomeRatio, 0.7);

        if (tsb < 0) signals++;
        if (readiness < 50) signals++;
        if (outcomeRatio < 0.5) signals++;

        // All fatigued or all fresh = agreement
        if (signals == 3 || signals == 0) agreeing = signals;
        // Mixed signals = partial agreement
        else agreeing = Math.min(signals, 3 - signals);

        if (signals == 0) return 1.0;
        return (double) agreeing / signals;
    }

    private double calculateStability(DecisionInput input) {
        double outcomeRatio = toDouble(input.recentOutcomeRatio, 0.7);
        if (outcomeRatio > 0.8) return 0.9;
        if (outcomeRatio > 0.6) return 0.7;
        if (outcomeRatio > 0.4) return 0.5;
        return 0.3;
    }

    // ─── HELPERS ───────────────────────────────────────────────────

    private static double toDouble(BigDecimal val) {
        return val != null ? val.doubleValue() : 0;
    }

    private static double toDouble(BigDecimal val, double defaultVal) {
        return val != null ? val.doubleValue() : defaultVal;
    }

    private static double round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static DecisionReason reason(String priority, String signal, String message, String evidence) {
        return DecisionReason.builder()
                .priority(priority)
                .signal(signal)
                .message(message)
                .evidence(evidence)
                .build();
    }

    // ─── INNER TYPES ───────────────────────────────────────────────

    @lombok.Getter
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DecisionInput {
        private BigDecimal readinessScore;
        private BigDecimal ctl;
        private BigDecimal atl;
        private BigDecimal tsb;
        private BigDecimal trainingMonotony;
        private String hrvTrend;
        private int weatherScore;
        private String weatherDescription;
        private BigDecimal plannedTss;
        private Integer plannedDurationMin;
        private String plannedType;
        private Integer timeAvailableMin;
        private BigDecimal recentOutcomeRatio;
        private boolean hasHrvData;
        private boolean hasWeatherData;
        private boolean hasRecentActivities;
    }

    // ─── PRIVATE ASSESSMENT RESULT HOLDERS ─────────────────────────

    private static class SafetyResult {
        List<DecisionReason> reasons = new ArrayList<>();
        int flags;
        boolean skip;
    }

    private static class AdaptationResult {
        List<DecisionReason> reasons = new ArrayList<>();
        boolean effective = true;
    }

    private static class PlanResult {
        List<DecisionReason> reasons = new ArrayList<>();
        boolean hasPlan;
    }

    private static class ContextResult {
        List<DecisionReason> reasons = new ArrayList<>();
        boolean badWeather;
        boolean marginalWeather;
        boolean severeTimeShortage;
        boolean limitedTime;
    }
}
