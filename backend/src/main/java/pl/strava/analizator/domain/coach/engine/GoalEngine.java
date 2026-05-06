package pl.strava.analizator.domain.coach.engine;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import pl.strava.analizator.domain.coach.model.AdaptationComponent;
import pl.strava.analizator.domain.coach.model.AdaptationDecomposition;
import pl.strava.analizator.domain.coach.model.GapAnalysis;
import pl.strava.analizator.domain.coach.model.Goal;
import pl.strava.analizator.domain.coach.model.GoalProgressSummary;
import pl.strava.analizator.domain.coach.model.GoalType;
import pl.strava.analizator.domain.coach.model.TrajectoryPhase;

public class GoalEngine {

    private static final double UNREALISTIC_WEEKLY_RATE = 5.0;
    private static final double AGGRESSIVE_WEEKLY_RATE = 2.5;

    public GapAnalysis analyzeGap(Goal goal) {
        double gap = goal.getTargetValue() - goal.getCurrentValue();
        double gapPercent = goal.getTargetValue() != 0
                ? Math.abs(gap / goal.getTargetValue()) * 100.0 : 0;

        double weeklyProgress = goal.getProgressPerWeek() != null ? goal.getProgressPerWeek() : 1.0;
        double weeksToTarget = weeklyProgress > 0 ? Math.abs(gap) / weeklyProgress : 999;

        boolean realistic = weeksToTarget < 52 || goal.getDeadline() == null
                || !goal.getDeadline().isBefore(LocalDate.now().plusDays((long) (weeksToTarget * 7)));

        String summary = gap > 0
                ? String.format("Gap: +%.1f (%.1f%% above current)", gap, gapPercent)
                : String.format("Gap: %.1f (%.1f%% below target) — goal achieved?", gap, gapPercent);

        return GapAnalysis.builder()
                .gap(gap)
                .gapPercent(gapPercent)
                .weeksToTarget(weeksToTarget)
                .realistic(realistic)
                .summary(summary)
                .build();
    }

    public AdaptationDecomposition decompose(Goal goal, double ftp, double vo2maxEstimate,
                                              double durabilityIndex, double weightKg) {
        Map<String, Double> componentWeights = computeComponentWeights(goal.getGoalType());

        double v02Level = normalizeVo2(vo2maxEstimate);
        double thresholdLevel = normalizeThreshold(ftp, weightKg);
        double enduranceLevel = normalizeEndurance(ftp, weightKg);
        double durabilityLevel = normalizeDurability(durabilityIndex);

        List<AdaptationComponent> components = new ArrayList<>();
        components.add(AdaptationComponent.builder()
                .name("VO2")
                .weight(componentWeights.getOrDefault("VO2", 0.0))
                .currentLevel(v02Level)
                .targetLevel(1.0)
                .description("Maximal oxygen uptake capacity")
                .build());
        components.add(AdaptationComponent.builder()
                .name("THRESHOLD")
                .weight(componentWeights.getOrDefault("THRESHOLD", 0.0))
                .currentLevel(thresholdLevel)
                .targetLevel(1.0)
                .description("Sustained power at lactate threshold")
                .build());
        components.add(AdaptationComponent.builder()
                .name("ENDURANCE")
                .weight(componentWeights.getOrDefault("ENDURANCE", 0.0))
                .currentLevel(enduranceLevel)
                .targetLevel(1.0)
                .description("Aerobic base and fat utilization")
                .build());
        components.add(AdaptationComponent.builder()
                .name("DURABILITY")
                .weight(componentWeights.getOrDefault("DURABILITY", 0.0))
                .currentLevel(durabilityLevel)
                .targetLevel(1.0)
                .description("Performance maintenance under fatigue")
                .build());

        AdaptationComponent focus = components.stream()
                .max(Comparator.comparingDouble(c -> c.getWeight() * (1.0 - c.getCurrentLevel())))
                .orElse(components.get(0));

        return AdaptationDecomposition.builder()
                .goal(goal)
                .components(components)
                .focusArea(focus.getName())
                .explanation("Primary focus: " + focus.getName() + " (weight: " + focus.getWeight()
                        + ", current: " + focus.getCurrentLevel() + ")")
                .build();
    }

    public TrajectoryPhase determinePhase(Goal goal, double gapPercent, double consistencyRatio) {
        if (gapPercent < 10.0 && consistencyRatio > 0.8) {
            return TrajectoryPhase.PEAK;
        }
        if (gapPercent < 30.0 || goal.getDeadline() == null) {
            return TrajectoryPhase.BUILD;
        }
        return TrajectoryPhase.BASE;
    }

    public GoalProgressSummary computeProgress(Goal goal, double consistencyRatio) {
        GapAnalysis gap = analyzeGap(goal);
        TrajectoryPhase phase = determinePhase(goal, gap.getGapPercent(), consistencyRatio);

        double weeklyProgress = goal.getProgressPerWeek() != null ? goal.getProgressPerWeek() : 0;
        double projectedDays = weeklyProgress > 0
                ? Math.abs(gap.getGap()) / weeklyProgress * 7 : 999;

        long daysToDeadline = goal.getDeadline() != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline()) : Long.MAX_VALUE;

        String status;
        if (gap.getGap() <= 0) {
            status = "ACHIEVED";
        } else if (projectedDays < daysToDeadline) {
            status = "ON_TRACK";
        } else if (projectedDays < daysToDeadline * 1.3) {
            status = "AT_RISK";
        } else {
            status = "OFF_TRACK";
        }

        return GoalProgressSummary.builder()
                .currentValue(goal.getCurrentValue())
                .targetValue(goal.getTargetValue())
                .gap(gap.getGap())
                .gapPercent(gap.getGapPercent())
                .projectedDaysToTarget(projectedDays)
                .phase(phase)
                .weeklyProgressRate(weeklyProgress)
                .status(status)
                .build();
    }

    private Map<String, Double> computeComponentWeights(GoalType goalType) {
        Map<String, Double> weights = new LinkedHashMap<>();
        switch (goalType) {
            case FTP:
                weights.put("THRESHOLD", 0.40);
                weights.put("VO2", 0.30);
                weights.put("ENDURANCE", 0.20);
                weights.put("DURABILITY", 0.10);
                break;
            case VO2MAX:
                weights.put("VO2", 0.50);
                weights.put("THRESHOLD", 0.25);
                weights.put("ENDURANCE", 0.15);
                weights.put("DURABILITY", 0.10);
                break;
            case POWER_DURATION:
                weights.put("VO2", 0.35);
                weights.put("THRESHOLD", 0.35);
                weights.put("DURABILITY", 0.20);
                weights.put("ENDURANCE", 0.10);
                break;
            case DISTANCE:
                weights.put("ENDURANCE", 0.50);
                weights.put("THRESHOLD", 0.20);
                weights.put("DURABILITY", 0.20);
                weights.put("VO2", 0.10);
                break;
            case TIME_ON_SEGMENT:
                weights.put("VO2", 0.40);
                weights.put("THRESHOLD", 0.35);
                weights.put("DURABILITY", 0.15);
                weights.put("ENDURANCE", 0.10);
                break;
            case DURABILITY:
                weights.put("DURABILITY", 0.45);
                weights.put("ENDURANCE", 0.25);
                weights.put("THRESHOLD", 0.20);
                weights.put("VO2", 0.10);
                break;
            case POWER_TO_WEIGHT:
                weights.put("VO2", 0.40);
                weights.put("THRESHOLD", 0.30);
                weights.put("ENDURANCE", 0.20);
                weights.put("DURABILITY", 0.10);
                break;
            default:
                weights.put("THRESHOLD", 0.35);
                weights.put("VO2", 0.30);
                weights.put("ENDURANCE", 0.25);
                weights.put("DURABILITY", 0.10);
        }
        return weights;
    }

    private double normalizeVo2(double vo2max) {
        if (vo2max <= 0) return 0.3;
        return Math.min(1.0, vo2max / 75.0);
    }

    private double normalizeThreshold(double ftp, double weightKg) {
        if (ftp <= 0 || weightKg <= 0) return 0.3;
        double wkg = ftp / weightKg;
        return Math.min(1.0, wkg / 5.5);
    }

    private double normalizeEndurance(double ftp, double weightKg) {
        if (ftp <= 0 || weightKg <= 0) return 0.3;
        double wkg = ftp / weightKg;
        return Math.min(1.0, wkg / 4.0);
    }

    private double normalizeDurability(double durabilityIndex) {
        return Math.min(1.0, Math.max(0.1, durabilityIndex));
    }
}
