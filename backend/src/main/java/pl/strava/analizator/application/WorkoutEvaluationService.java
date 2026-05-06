package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.DerivedMetrics;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.ExecutedWorkout;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.HistoricalContext;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.PlannedWorkout;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.RecoveryContext;
import pl.strava.analizator.application.dto.WorkoutEvaluationResponse;
import pl.strava.analizator.application.dto.WorkoutEvaluationResponse.WorkoutAnalysis;
import pl.strava.analizator.application.dto.WorkoutEvaluationResponse.ContextualFactors;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityTrainingEffect;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.model.FatigueDrift;
import pl.strava.analizator.domain.model.ExecutionStability;
import pl.strava.analizator.domain.model.FatigueState;
import pl.strava.analizator.domain.model.HrResponseLevel;
import pl.strava.analizator.domain.model.TrainingIntent;
import pl.strava.analizator.domain.model.TrainingLoadTrend;
import pl.strava.analizator.domain.model.WorkoutOutcome;

@Service
@RequiredArgsConstructor
public class WorkoutEvaluationService {

    private static final int DEFAULT_HR_MAX = 185;
    private static final int DEFAULT_FTP_WATTS = 200;
    private static final BigDecimal DEFAULT_BASELINE_HRV = BigDecimal.valueOf(50);

    public WorkoutEvaluationResponse evaluate(WorkoutEvaluationRequest request) {
        TrainingIntent intent = parseIntent(request.getTrainingIntent());
        PlannedWorkout planned = request.getPlanned();
        ExecutedWorkout actual = request.getActual();
        DerivedMetrics derived = request.getDerived();
        HistoricalContext history = request.getHistorical();
        RecoveryContext recovery = request.getRecovery();
        short ftpWatts = request.getAthleteFtpWatts() != null ? request.getAthleteFtpWatts() : DEFAULT_FTP_WATTS;
        int hrMax = request.getAthleteHrMaxBpm() != null ? request.getAthleteHrMaxBpm() : DEFAULT_HR_MAX;

        boolean hasHrData = actual.getAvgHeartRateBpm() != null;
        boolean hasPowerStream = derived.getIntervalPowerValues() != null && !derived.getIntervalPowerValues().isEmpty();
        boolean hasFullData = hasHrData && hasPowerStream && history.getTsb() != null && history.getCtl() != null;

        int powerCompliance = evaluatePowerCompliance(planned, actual, intent, ftpWatts);
        double actualPowerRatio = computeActualPowerRatio(planned, actual, ftpWatts);
        int intervalCompletion = evaluateIntervalCompletion(planned, actual);
        int timeInZoneAccuracy = evaluateTimeInZone(planned, actual, intent);
        HrResponseLevel hrResponse = evaluateHrResponse(actual, intent, hrMax);
        FatigueDrift fatigueDrift = evaluateFatigueDrift(derived, actual, ftpWatts);
        ExecutionStability stability = evaluateStability(derived, actual, intent);

        FatigueState fatigueState = evaluateFatigueState(history, recovery);
        boolean recentFailures = detectRecentFailures(history);
        TrainingLoadTrend loadTrend = evaluateLoadTrend(history);

        int hrResponseScore = mapHrResponseToScore(hrResponse);
        int stabilityScore = mapStabilityToScore(stability);
        int rawScore = (int) Math.round(
                0.35 * powerCompliance +
                0.25 * intervalCompletion +
                0.20 * timeInZoneAccuracy +
                0.10 * hrResponseScore +
                0.10 * stabilityScore);

        int contextualAdjustment = computeContextualAdjustment(rawScore, powerCompliance, fatigueState, recentFailures, intent);
        int adjustedScore = Math.max(0, Math.min(100, rawScore + contextualAdjustment));

        WorkoutOutcome outcome = classifyOutcome(adjustedScore, powerCompliance, actualPowerRatio, fatigueState, recentFailures);

        double confidence = computeConfidence(hasHrData, hasFullData, hrResponse, fatigueDrift, stability);

        List<String> reasons = buildReasons(outcome, powerCompliance, intervalCompletion, timeInZoneAccuracy,
                hrResponse, fatigueDrift, stability, fatigueState, recentFailures);

        String insight = buildInsight(outcome, intent, powerCompliance, hrResponse, fatigueDrift, fatigueState);
        String recommendation = buildRecommendation(outcome, intent, fatigueState, recentFailures, adjustedScore);

        return WorkoutEvaluationResponse.builder()
                .outcome(outcome.name())
                .score(adjustedScore)
                .confidence(confidence)
                .reasons(reasons)
                .analysis(WorkoutAnalysis.builder()
                        .powerCompliance(powerCompliance)
                        .intervalCompletion(intervalCompletion)
                        .timeInZoneAccuracy(timeInZoneAccuracy)
                        .hrResponse(hrResponse.name())
                        .fatigueDrift(fatigueDrift.name())
                        .executionStability(stability.name())
                        .build())
                .contextualFactors(ContextualFactors.builder()
                        .fatigueState(fatigueState.name())
                        .recentFailures(recentFailures)
                        .trainingLoadTrend(loadTrend.name())
                        .build())
                .insight(insight)
                .recommendation(recommendation)
                .build();
    }

    private TrainingIntent parseIntent(String intent) {
        if (intent == null) return TrainingIntent.ENDURANCE;
        try {
            return TrainingIntent.valueOf(intent.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TrainingIntent.ENDURANCE;
        }
    }

    private int evaluatePowerCompliance(PlannedWorkout planned, ExecutedWorkout actual, TrainingIntent intent, short ftpWatts) {
        if (planned == null || actual == null) return 70;

        Double targetPower = resolveTargetPower(planned, ftpWatts);
        Double actualPower = actual.getNormalizedPowerW() != null ? actual.getNormalizedPowerW() : actual.getAvgPowerW();
        if (targetPower == null || targetPower <= 0 || actualPower == null || actualPower <= 0) return 70;

        double pctDelta = Math.abs((actualPower - targetPower) / targetPower) * 100.0;
        double tolerance = getPowerTolerance(intent);

        if (pctDelta <= tolerance) return 100;
        if (pctDelta <= tolerance * 2.0) return 85;
        if (pctDelta <= tolerance * 3.0) return 60;
        return 35;
    }

    private double getPowerTolerance(TrainingIntent intent) {
        return switch (intent) {
            case THRESHOLD -> 4.0;
            case VO2_MAX -> 6.5;
            case ANAEROBIC -> 8.0;
            case RECOVERY -> 10.0;
            case ENDURANCE -> 10.0;
        };
    }

    private Double resolveTargetPower(PlannedWorkout planned, short ftpWatts) {
        if (planned.getTargetPowerW() != null && planned.getTargetPowerW() > 0) return planned.getTargetPowerW();
        if (planned.getTargetPowerPctFtp() != null && planned.getTargetPowerPctFtp() > 0) {
            return ftpWatts * (planned.getTargetPowerPctFtp() / 100.0);
        }
        if (planned.getIntervalPowerW() != null && planned.getIntervalPowerW() > 0) return (double) planned.getIntervalPowerW();
        if (planned.getIntervalPowerPctFtp() != null && planned.getIntervalPowerPctFtp() > 0) {
            return ftpWatts * (planned.getIntervalPowerPctFtp() / 100.0);
        }
        return null;
    }

    private int evaluateIntervalCompletion(PlannedWorkout planned, ExecutedWorkout actual) {
        if (planned.getPlannedIntervals() == null || planned.getPlannedIntervals() <= 0) {
            return 100;
        }
        int plannedCount = planned.getPlannedIntervals();
        int actualCount = actual.getCompletedIntervals() != null ? actual.getCompletedIntervals() : 0;

        if (actualCount >= plannedCount) return 100;
        double ratio = (double) actualCount / plannedCount;
        if (ratio >= 0.85) return 85;
        if (ratio >= 0.65) return 60;
        if (ratio >= 0.40) return 40;
        return 20;
    }

    private int evaluateTimeInZone(PlannedWorkout planned, ExecutedWorkout actual, TrainingIntent intent) {
        if (planned == null || actual == null) return 70;

        Map<String, Double> targetDistribution = planned.getTargetZoneDistribution();
        Map<String, Double> actualZones = actual.getTimeInZones();

        if (targetDistribution == null || targetDistribution.isEmpty() || actualZones == null || actualZones.isEmpty()) {
            return 70;
        }

        String targetZoneKey = getTargetZoneKeyForIntent(intent);
        Double targetFraction = targetDistribution.get(targetZoneKey);
        Double actualFraction = actualZones.get(targetZoneKey);

        if (targetFraction == null || targetFraction <= 0) return 70;
        if (actualFraction == null) return 30;

        double delta = Math.abs(actualFraction - targetFraction);
        if (delta <= 5.0) return 100;
        if (delta <= 12.0) return 85;
        if (delta <= 22.0) return 60;
        return 35;
    }

    private String getTargetZoneKeyForIntent(TrainingIntent intent) {
        return switch (intent) {
            case RECOVERY -> "Z1";
            case ENDURANCE -> "Z2";
            case THRESHOLD -> "Z4";
            case VO2_MAX -> "Z5";
            case ANAEROBIC -> "Z6";
        };
    }

    private HrResponseLevel evaluateHrResponse(ExecutedWorkout actual, TrainingIntent intent, int hrMax) {
        if (actual.getAvgHeartRateBpm() == null || actual.getMaxHeartRateBpm() == null) {
            return HrResponseLevel.LOW;
        }

        double avgHrPct = ((double) actual.getAvgHeartRateBpm() / hrMax) * 100.0;
        double maxHrPct = ((double) actual.getMaxHeartRateBpm() / hrMax) * 100.0;

        double expectedAvgPct = getExpectedHrPct(intent);
        double expectedMaxPct = getExpectedMaxHrPct(intent);

        if (avgHrPct >= expectedAvgPct && maxHrPct >= expectedMaxPct) return HrResponseLevel.HIGH;
        if (avgHrPct >= expectedAvgPct * 0.85) return HrResponseLevel.OK;
        return HrResponseLevel.LOW;
    }

    private double getExpectedHrPct(TrainingIntent intent) {
        return switch (intent) {
            case VO2_MAX -> 90.0;
            case THRESHOLD -> 82.0;
            case ANAEROBIC -> 85.0;
            case ENDURANCE -> 68.0;
            case RECOVERY -> 55.0;
        };
    }

    private double getExpectedMaxHrPct(TrainingIntent intent) {
        return switch (intent) {
            case VO2_MAX -> 95.0;
            case THRESHOLD -> 88.0;
            case ANAEROBIC -> 92.0;
            case ENDURANCE -> 75.0;
            case RECOVERY -> 62.0;
        };
    }

    private FatigueDrift evaluateFatigueDrift(DerivedMetrics derived, ExecutedWorkout actual, short ftpWatts) {
        if (derived == null) return FatigueDrift.LOW;

        double driftScore = 0;
        int driftSignals = 0;

        if (derived.getDecouplingPwHr() != null) {
            double decoupling = derived.getDecouplingPwHr();
            if (decoupling > 5.0) driftScore += 2;
            else if (decoupling > 2.5) driftScore += 1;
            driftSignals++;
        }

        if (derived.getIntervalPowerValues() != null && !derived.getIntervalPowerValues().isEmpty()) {
            List<Double> powers = derived.getIntervalPowerValues();
            if (powers.size() >= 2) {
                double firstAvg = averageFirstHalf(powers);
                double secondAvg = averageSecondHalf(powers);
                if (firstAvg > 0) {
                    double fade = ((firstAvg - secondAvg) / firstAvg) * 100.0;
                    if (fade > 5.0) driftScore += 2;
                    else if (fade > 2.5) driftScore += 1;
                    driftSignals++;
                }
            }
        }

        if (derived.getIntervalHeartRateValues() != null && !derived.getIntervalHeartRateValues().isEmpty()) {
            List<Integer> hrs = derived.getIntervalHeartRateValues();
            if (hrs.size() >= 2) {
                double firstAvgHr = averageFirstHalfInt(hrs);
                double secondAvgHr = averageSecondHalfInt(hrs);
                if (firstAvgHr > 0) {
                    double hrDrift = ((secondAvgHr - firstAvgHr) / firstAvgHr) * 100.0;
                    if (hrDrift > 5.0) driftScore += 1.5;
                    else if (hrDrift > 2.0) driftScore += 0.5;
                    driftSignals++;
                }
            }
        }

        if (driftSignals == 0) return FatigueDrift.LOW;
        double avgDrift = driftScore / driftSignals;
        if (avgDrift >= 1.5) return FatigueDrift.HIGH;
        if (avgDrift >= 0.5) return FatigueDrift.MODERATE;
        return FatigueDrift.LOW;
    }

    private ExecutionStability evaluateStability(DerivedMetrics derived, ExecutedWorkout actual, TrainingIntent intent) {
        if (derived == null) return ExecutionStability.MODERATE;

        int signals = 0;
        double instabilityScore = 0;

        if (derived.getVariabilityIndex() != null) {
            double vi = derived.getVariabilityIndex();
            double viThreshold = getViThreshold(intent);
            if (vi > viThreshold + 0.08) instabilityScore += 2;
            else if (vi > viThreshold + 0.04) instabilityScore += 1;
            signals++;
        }

        if (derived.getIntervalPowerValues() != null && derived.getIntervalPowerValues().size() >= 3) {
            List<Double> powers = derived.getIntervalPowerValues();
            double mean = powers.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            if (mean > 0) {
                double cv = Math.sqrt(powers.stream()
                        .mapToDouble(p -> Math.pow(p - mean, 2))
                        .average().orElse(0)) / mean;
                if (cv > 0.10) instabilityScore += 2;
                else if (cv > 0.06) instabilityScore += 1;
                signals++;
            }
        }

        if (signals == 0) return ExecutionStability.MODERATE;
        double avgInstability = instabilityScore / signals;
        if (avgInstability >= 1.5) return ExecutionStability.LOW;
        if (avgInstability >= 0.5) return ExecutionStability.MODERATE;
        return ExecutionStability.HIGH;
    }

    private double getViThreshold(TrainingIntent intent) {
        return switch (intent) {
            case ENDURANCE, RECOVERY -> 1.05;
            case THRESHOLD -> 1.08;
            default -> 1.12;
        };
    }

    private FatigueState evaluateFatigueState(HistoricalContext history, RecoveryContext recovery) {
        if (history == null) return FatigueState.MODERATE;

        int fatigueSignals = 0;
        double fatigueScore = 0;

        if (history.getTsb() != null) {
            double tsb = history.getTsb();
            if (tsb < -30) fatigueScore += 3;
            else if (tsb < -15) fatigueScore += 2;
            else if (tsb < -5) fatigueScore += 1;
            fatigueSignals++;
        }

        if (history.getAtl() != null && history.getCtl() != null && history.getCtl() > 0) {
            double ratio = history.getAtl() / history.getCtl();
            if (ratio > 1.3) fatigueScore += 2;
            else if (ratio > 1.1) fatigueScore += 1;
            fatigueSignals++;
        }

        if (recovery != null && recovery.getSubjectiveReadinessScore() != null) {
            double readiness = recovery.getSubjectiveReadinessScore();
            if (readiness < 4.0) fatigueScore += 2;
            else if (readiness < 6.0) fatigueScore += 1;
            fatigueSignals++;
        }

        if (recovery != null && recovery.getSleepQuality() != null) {
            double sleep = recovery.getSleepQuality();
            if (sleep < 4.0) fatigueScore += 1;
            fatigueSignals++;
        }

        if (fatigueSignals == 0) return FatigueState.MODERATE;
        double avgFatigue = fatigueScore / fatigueSignals;
        if (avgFatigue >= 2.0) return FatigueState.HIGH;
        if (avgFatigue >= 1.0) return FatigueState.MODERATE;
        return FatigueState.LOW;
    }

    private boolean detectRecentFailures(HistoricalContext history) {
        if (history == null || history.getRecentWorkoutOutcomes() == null) return false;
        List<String> outcomes = history.getRecentWorkoutOutcomes();
        long failures = outcomes.stream()
                .filter(o -> "FAIL".equals(o) || "MISSED_STIMULUS".equals(o) || "TOO_EASY".equals(o))
                .count();
        return failures >= 2;
    }

    private TrainingLoadTrend evaluateLoadTrend(HistoricalContext history) {
        if (history == null || history.getCtl() == null || history.getLast7DaysTss() == null
                || history.getLast28DaysTss() == null) {
            return TrainingLoadTrend.STABLE;
        }
        double recentRatio = history.getLast7DaysTss().doubleValue() / Math.max(1, 7);
        double longRatio = history.getLast28DaysTss().doubleValue() / Math.max(1, 28);
        if (recentRatio > longRatio * 1.15) return TrainingLoadTrend.INCREASING;
        if (recentRatio < longRatio * 0.85) return TrainingLoadTrend.DECREASING;
        return TrainingLoadTrend.STABLE;
    }

    private int mapHrResponseToScore(HrResponseLevel level) {
        return switch (level) {
            case HIGH -> 100;
            case OK -> 65;
            case LOW -> 30;
        };
    }

    private int mapStabilityToScore(ExecutionStability stability) {
        return switch (stability) {
            case HIGH -> 100;
            case MODERATE -> 65;
            case LOW -> 30;
        };
    }

    private int computeContextualAdjustment(int rawScore, int powerCompliance,
                                            FatigueState fatigueState, boolean recentFailures, TrainingIntent intent) {
        int adjustment = 0;

        if (fatigueState == FatigueState.HIGH) {
            adjustment += 10;
        } else if (fatigueState == FatigueState.LOW) {
            adjustment -= 5;
        }

        if (recentFailures) {
            adjustment -= 8;
        }

        if (powerCompliance > 90 && fatigueState == FatigueState.HIGH) {
            adjustment -= 5;
        }

        return adjustment;
    }

    private WorkoutOutcome classifyOutcome(int score, int powerCompliance, double actualPowerRatio,
                                            FatigueState fatigue, boolean recentFailures) {
        if (actualPowerRatio >= 1.08 && fatigue == FatigueState.HIGH) {
            return WorkoutOutcome.OVERACHIEVE;
        }
        if (score >= 85 && powerCompliance >= 85) {
            return WorkoutOutcome.SUCCESS;
        }
        if (score >= 65) return WorkoutOutcome.PARTIAL;

        if (recentFailures || fatigue == FatigueState.HIGH) {
            return WorkoutOutcome.PARTIAL;
        }
        return WorkoutOutcome.FAIL;
    }

    private double computeActualPowerRatio(PlannedWorkout planned, ExecutedWorkout actual, short ftpWatts) {
        Double targetPower = resolveTargetPower(planned, ftpWatts);
        Double actualPower = actual.getNormalizedPowerW() != null ? actual.getNormalizedPowerW() : actual.getAvgPowerW();
        if (targetPower == null || targetPower <= 0 || actualPower == null || actualPower <= 0) return 1.0;
        return actualPower / targetPower;
    }

    private double computeConfidence(boolean hasHr, boolean hasFullData,
                                      HrResponseLevel hrResponse, FatigueDrift fatigueDrift,
                                      ExecutionStability stability) {
        double confidence = 0.5;

        if (hasHr) confidence += 0.15;
        else confidence -= 0.10;

        if (hasFullData) confidence += 0.15;
        else confidence -= 0.05;

        if (fatigueDrift != FatigueDrift.LOW) confidence += 0.05;

        if (hrResponse == HrResponseLevel.LOW && !hasHr) {
            confidence -= 0.10;
        }

        if (stability == ExecutionStability.HIGH || stability == ExecutionStability.LOW) {
            confidence += 0.05;
        } else {
            confidence -= 0.05;
        }

        return Math.max(0.15, Math.min(0.95, confidence));
    }

    private List<String> buildReasons(WorkoutOutcome outcome, int powerCompliance, int intervalCompletion,
                                       int timeInZone, HrResponseLevel hrResponse, FatigueDrift drift,
                                       ExecutionStability stability, FatigueState fatigue, boolean recentFailures) {
        List<String> reasons = new ArrayList<>();

        if (powerCompliance >= 90) reasons.add("Moc bardzo blisko celu");
        else if (powerCompliance >= 75) reasons.add("Moc akceptowalna, ale poniżej optymalnego zakresu");
        else reasons.add("Znaczne odchylenie mocy od celu");

        if (intervalCompletion >= 90) reasons.add("Interwały zrealizowane w całości");
        else if (intervalCompletion < 60) reasons.add("Nieukończono większości interwałów");

        if (timeInZone < 60) reasons.add("Niska zgodność czasu w strefie docelowej");

        if (drift == FatigueDrift.HIGH) reasons.add("Wysoki dryft — spadek wydajności w trakcie treningu");
        else if (drift == FatigueDrift.MODERATE) reasons.add("Umiarkowany dryft w trakcie sesji");

        if (stability == ExecutionStability.LOW) reasons.add("Niska stabilność wykonania");

        if (fatigue == FatigueState.HIGH) reasons.add("Wysokie zmęczenie przed treningiem obniża oczekiwania");

        if (recentFailures) reasons.add("Powtarzające się niepowodzenia — zweryfikuj plan");

        if (hrResponse == HrResponseLevel.LOW) reasons.add("Niska odpowiedź tętna — bodziec mógł nie zadziałać");
        else if (hrResponse == HrResponseLevel.HIGH) reasons.add("Dobra odpowiedź tętna — bodziec trafiony");

        return reasons;
    }

    private String buildInsight(WorkoutOutcome outcome, TrainingIntent intent, int powerCompliance,
                                 HrResponseLevel hrResponse, FatigueDrift drift, FatigueState fatigue) {
        String intentLabel = switch (intent) {
            case VO2_MAX -> "VO2max";
            case THRESHOLD -> "progowy";
            case ENDURANCE -> "wytrzymałościowy";
            case RECOVERY -> "regeneracyjny";
            case ANAEROBIC -> "anaerobowy";
        };

        return switch (outcome) {
            case SUCCESS -> "Bodziec " + intentLabel + " został skutecznie dostarczony. "
                    + (drift == FatigueDrift.HIGH ? "Widoczny dryft sugeruje jednak uważność na regenerację." : "");
            case PARTIAL -> "Częściowy bodziec " + intentLabel + " — "
                    + (fatigue == FatigueState.HIGH ? "zmęczenie mogło ograniczyć jakość." : "warto poprawić wykonanie.");
            case FAIL -> "Bodziec " + intentLabel + " nie został osiągnięty. "
                    + (hrResponse == HrResponseLevel.LOW ? "Brak odpowiedzi tętna to kluczowy sygnał." : "Sprawdź plan i gotowość.");
            case OVERACHIEVE -> "Trening przekroczył założenia " + intentLabel + " — "
                    + (fatigue == FatigueState.HIGH ? "ryzyko przeciążenia jest wysokie." : "ale może to być pozytywny sygnał.");
        };
    }

    private String buildRecommendation(WorkoutOutcome outcome, TrainingIntent intent,
                                        FatigueState fatigue, boolean recentFailures, int score) {
        if (recentFailures && score < 70) {
            return "Zregresuj — zmniejsz objętość/intensywność na 3-5 dni i skup się na regeneracji.";
        }

        if (fatigue == FatigueState.HIGH && outcome == WorkoutOutcome.OVERACHIEVE) {
            return "Powtórz sesję docelową, ale z mniejszą objętością — ryzyko przetrenowania.";
        }

        return switch (outcome) {
            case SUCCESS -> "Progresuj — możesz zwiększyć bodziec w kolejnej sesji tego typu.";
            case PARTIAL -> "Powtórz — utrzymaj tę samą strukturę, popraw wykonanie.";
            case FAIL -> fatigue == FatigueState.HIGH
                    ? "Zregresuj — priorytetem jest regeneracja przed kolejną próbą."
                    : "Powtórz — spróbuj tej samej sesji przy lepszej gotowości.";
            case OVERACHIEVE -> "Progresuj ostrożnie — zwiększaj bodziec, ale monitoruj zmęczenie.";
        };
    }

    private double averageFirstHalf(List<Double> values) {
        int mid = values.size() / 2;
        return values.subList(0, mid).stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private double averageSecondHalf(List<Double> values) {
        int mid = values.size() / 2;
        return values.subList(mid, values.size()).stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private double averageFirstHalfInt(List<Integer> values) {
        int mid = values.size() / 2;
        return values.subList(0, mid).stream().mapToInt(Integer::intValue).average().orElse(0);
    }

    private double averageSecondHalfInt(List<Integer> values) {
        int mid = values.size() / 2;
        return values.subList(mid, values.size()).stream().mapToInt(Integer::intValue).average().orElse(0);
    }

    // ──────────────────────────────────────────────
    //  Training Effect calculation (post-workout auto-scoring)
    // ──────────────────────────────────────────────

    public ActivityTrainingEffect calculateTrainingEffect(Activity activity, AthleteProfile profile,
                                                          DailySummary daySummary) {
        short ftpWatts = (profile != null && profile.hasFtp()) ? profile.getFtpWatts() : DEFAULT_FTP_WATTS;
        int hrMax = (profile != null && profile.getMaxHrBpm() != null) ? profile.getMaxHrBpm() : DEFAULT_HR_MAX;
        short lthr = (profile != null && profile.getLthrBpm() != null) ? profile.getLthrBpm() : 0;
        BigDecimal restingHrBaseline = (profile != null && profile.getRestingHrBpm() != null)
                ? BigDecimal.valueOf(profile.getRestingHrBpm()) : null;

        boolean hasPower = activity.hasPowerData();
        boolean hasHr = activity.hasHeartrateData();
        String dataQuality = hasPower && hasHr ? "BOTH" : (hasPower ? "POWER_ONLY" : (hasHr ? "HR_ONLY" : "ESTIMATED"));

        // 1. Training Score
        int trainingScore = calculateTrainingScore(activity, ftpWatts);

        // 2. Aerobic TE (from HR if available, using LTHR-based zones when possible)
        BigDecimal aerobicTe = hasHr ? calculateAerobicTe(activity, lthr > 0 ? lthr : hrMax, lthr > 0) : null;
        String aerobicLabel = aerobicTe != null ? aerobicTeLabel(aerobicTe) : null;

        // 3. Anaerobic TE (from power if available)
        BigDecimal anaerobicTe = hasPower ? calculateAnaerobicTe(activity, ftpWatts) : null;
        String anaerobicLabel = anaerobicTe != null ? anaerobicTeLabel(anaerobicTe) : null;

        // 4. Primary Benefit
        double ifVal = estimateIf(activity, ftpWatts);
        String primaryBenefit = classifyPrimaryBenefit(activity, ftpWatts, lthr, ifVal);
        String secondaryBenefit = null;

        // 5. Recovery Time
        BigDecimal tsb = resolveTsb(daySummary);
        BigDecimal hrvCurrent = (daySummary != null && daySummary.getHrvRmssd() != null)
                ? daySummary.getHrvRmssd() : null;
        int recoveryHours = calculateRecoveryTime(activity, ftpWatts, tsb, hrvCurrent, DEFAULT_BASELINE_HRV);

        // Diagnostic details
        Map<String, Object> details = new HashMap<>();
        details.put("ftp", ftpWatts);
        details.put("hr_max", hrMax);
        details.put("lthr", lthr);
        details.put("if", Math.round(ifVal * 1000.0) / 1000.0);
        details.put("datapoints_power", hasPower ? activity.getPowerStream().length : 0);
        details.put("datapoints_hr", hasHr ? activity.getHeartrateStream().length : 0);

        return ActivityTrainingEffect.builder()
                .activityId(activity.getId())
                .trainingScore(trainingScore)
                .aerobicTe(aerobicTe)
                .anaerobicTe(anaerobicTe)
                .aerobicLabel(aerobicLabel)
                .anaerobicLabel(anaerobicLabel)
                .primaryBenefit(primaryBenefit)
                .secondaryBenefit(secondaryBenefit)
                .recoveryTimeHours(recoveryHours)
                .calculatedAt(Instant.now())
                .dataQuality(dataQuality)
                .details(details)
                .build();
    }

    // ── Training Score (0-100) ──

    int calculateTrainingScore(Activity activity, short ftpWatts) {
        double tss = estimateTss(activity, ftpWatts);
        double ifVal = estimateIf(activity, ftpWatts);
        double vi = estimateVariabilityIndex(activity);

        double tssScore = Math.min(100, 20.0 * Math.log(1 + tss / 10.0));

        double durationHours = (activity.getMovingTimeSec() != null ? activity.getMovingTimeSec() : 1) / 3600.0;
        double optimalIf = 0.95 - 0.05 * Math.log(Math.max(durationHours, 0.1) + 1);
        double ifScore = 1.0 - Math.abs(ifVal - optimalIf) * 0.6;

        double viScore = vi > 1.5 ? 0.85 : (vi > 1.3 ? 0.95 : 1.0);

        return (int) Math.max(0, Math.min(100, Math.round(tssScore * ifScore * viScore)));
    }

    // ── Aerobic TE (0.0-5.0, HR-based) ──

    BigDecimal calculateAerobicTe(Activity activity, int anchorBpm, boolean useLthr) {
        int[] hr = activity.getHeartrateStream();
        if (hr == null || hr.length == 0) return null;

        int movingSeconds = activity.getMovingTimeSec() != null ? activity.getMovingTimeSec() : hr.length;
        double durationMinutes = movingSeconds / 60.0;

        Map<Integer, Double> zoneTimeMin = hrZoneTimeMinutes(hr, anchorBpm, useLthr, movingSeconds);

        double[] weights = {10.0, 25.0, 40.0, 55.0, 80.0, 25.0};
        double aerobicStimulus = 0;
        for (int z = 1; z <= 5; z++) {
            aerobicStimulus += zoneTimeMin.getOrDefault(z, 0.0) * weights[z - 1];
        }

        double durationFactor = Math.max(0.5, Math.min(1.5, 1.0 + (durationMinutes - 30) / 180.0));

        double cvHr = hr.length > 1 ? coefficientOfVariationInt(hr) : 0;
        double variabilityBonus = 1.0 + Math.min(cvHr * 2.0, 0.3);

        double rawEpoc = aerobicStimulus * durationFactor * variabilityBonus / 100.0;
        return BigDecimal.valueOf(epocToTe(rawEpoc)).setScale(1, RoundingMode.HALF_UP);
    }

    // ── Anaerobic TE (0.0-5.0, power-based) ──

    BigDecimal calculateAnaerobicTe(Activity activity, short ftpWatts) {
        int[] power = activity.getPowerStream();
        if (power == null || power.length == 0) return null;

        int movingSeconds = activity.getMovingTimeSec() != null ? activity.getMovingTimeSec() : power.length;

        Map<Integer, Double> zoneTimeMin = powerZoneTimeMinutes(power, ftpWatts, movingSeconds);

        double[] weights = {30.0, 60.0, 90.0};
        double anaerobicStimulus = 0;
        for (int z = 5; z <= 7; z++) {
            anaerobicStimulus += zoneTimeMin.getOrDefault(z, 0.0) * weights[z - 5];
        }

        double peakBonus = computePeakPowerBonus(power, ftpWatts, movingSeconds);

        double totalTimeSec = Math.max(movingSeconds, 1);
        double timeAbove110 = 0;
        for (int p : power) {
            if (p > ftpWatts * 1.10) timeAbove110++;
        }
        double densityBonus = 1.0 + (timeAbove110 / totalTimeSec) * 5.0;

        double rawAnaerobic = anaerobicStimulus * peakBonus * densityBonus / 100.0;
        return BigDecimal.valueOf(anaerobicEpocToTe(rawAnaerobic)).setScale(1, RoundingMode.HALF_UP);
    }

    // ── Primary Benefit ──

    String classifyPrimaryBenefit(Activity activity, short ftpWatts, short lthr, double ifVal) {
        int[] power = activity.getPowerStream();
        int movingSeconds = activity.getMovingTimeSec() != null ? activity.getMovingTimeSec() : 3600;
        double durationHours = movingSeconds / 3600.0;

        double[] zoneWeights = {0.1, 0.5, 0.7, 0.9, 1.2, 1.8, 2.0};

        int dominantZone = 1;

        if (power != null && power.length > 0) {
            Map<Integer, Double> zoneTimeMin = powerZoneTimeMinutes(power, ftpWatts, movingSeconds);
            double maxWeighted = 0;
            int secondZone = 1;
            double secondWeighted = 0;
            for (int z = 1; z <= 7; z++) {
                double weighted = zoneTimeMin.getOrDefault(z, 0.0) * zoneWeights[z - 1];
                if (weighted > maxWeighted) {
                    secondZone = dominantZone;
                    secondWeighted = maxWeighted;
                    maxWeighted = weighted;
                    dominantZone = z;
                } else if (weighted > secondWeighted) {
                    secondWeighted = weighted;
                    secondZone = z;
                }
            }

            // Tie-breaking: if second zone is close (<15% difference) and is lower intensity,
            // prefer the lower zone to avoid over-classifying due to short power spikes
            if (maxWeighted > 0 && secondWeighted > 0) {
                double ratio = secondWeighted / maxWeighted;
                if (ratio > 0.85 && secondZone < dominantZone && dominantZone >= 5) {
                    dominantZone = secondZone;
                }
            }

            // Also check: if median power is in endurance/tempo zones, downgrade
            double medianPct = medianPowerPctFtp(power, ftpWatts);
            int medianZone = zoneForPowerPct(medianPct);
            if (dominantZone >= 5 && medianZone <= 3) {
                dominantZone = Math.min(dominantZone, 4);
            }
        } else if (activity.hasHeartrateData()) {
            int anchor = lthr > 0 ? lthr : DEFAULT_HR_MAX;
            boolean useLthr = lthr > 0;
            Map<Integer, Double> zoneTimeMin = hrZoneTimeMinutes(activity.getHeartrateStream(), anchor, useLthr, movingSeconds);
            double maxWeighted = 0;
            for (int z = 1; z <= 5; z++) {
                double weighted = zoneTimeMin.getOrDefault(z, 0.0) * zoneWeights[z - 1];
                if (weighted > maxWeighted) {
                    maxWeighted = weighted;
                    dominantZone = z;
                }
            }
        }

        // IF-based sanity check
        if (dominantZone >= 6 && ifVal < 0.95) dominantZone = 5;
        if (dominantZone == 5 && ifVal < 0.85) dominantZone = 4;
        if (dominantZone == 4 && ifVal < 0.80) dominantZone = 3;
        if (dominantZone == 3 && ifVal < 0.60) dominantZone = 2;

        return benefitFromZone(dominantZone, durationHours);
    }

    // ── Recovery Time (hours) ──

    int calculateRecoveryTime(Activity activity, short ftpWatts, BigDecimal tsb,
                              BigDecimal hrvCurrent, BigDecimal baselineHrv) {
        double tss = estimateTss(activity, ftpWatts);
        double ifVal = estimateIf(activity, ftpWatts);

        double baseHours = tss / 7.0;

        double ifMultiplier = ifVal <= 0.75 ? 0.8 :
                ifVal <= 0.85 ? 1.0 :
                        ifVal <= 0.95 ? 1.3 :
                                ifVal <= 1.05 ? 1.7 : 2.0;

        double tsbVal = tsb != null ? tsb.doubleValue() : 0;
        double fatigueMultiplier = tsbVal >= 0 ? 0.85 :
                tsbVal >= -10 ? 1.0 :
                        tsbVal >= -20 ? 1.2 :
                                tsbVal >= -30 ? 1.5 : 2.0;

        double hrvMultiplier = 1.0;
        if (hrvCurrent != null && baselineHrv != null && baselineHrv.doubleValue() > 0) {
            double ratio = hrvCurrent.doubleValue() / baselineHrv.doubleValue();
            hrvMultiplier = ratio >= 1.0 ? 0.85 :
                    ratio >= 0.8 ? 1.0 :
                            ratio >= 0.6 ? 1.3 : 1.6;
        }

        return (int) Math.max(1, Math.min(96,
                Math.round(baseHours * ifMultiplier * fatigueMultiplier * hrvMultiplier)));
    }

    // ── Zone classification helpers ──

    private Map<Integer, Double> hrZoneTimeMinutes(int[] hrStream, int anchorBpm, boolean useLthr, int movingSeconds) {
        Map<Integer, Double> zoneTime = new HashMap<>();
        if (hrStream.length == 0 || movingSeconds <= 0) return zoneTime;

        double secPerSample = (double) movingSeconds / hrStream.length;

        for (int h : hrStream) {
            if (h <= 0) continue;
            double pct = ((double) h / anchorBpm) * 100.0;
            int zone;
            if (useLthr) {
                if (pct < 68) zone = 1;
                else if (pct < 83) zone = 2;
                else if (pct < 94) zone = 3;
                else if (pct < 105) zone = 4;
                else zone = 5;
            } else {
                if (pct < 60) zone = 1;
                else if (pct < 70) zone = 2;
                else if (pct < 80) zone = 3;
                else if (pct < 90) zone = 4;
                else if (pct < 100) zone = 5;
                else zone = 6;
            }
            zoneTime.merge(zone, secPerSample / 60.0, Double::sum);
        }
        return zoneTime;
    }

    private Map<Integer, Double> powerZoneTimeMinutes(int[] powerStream, short ftpWatts, int movingSeconds) {
        Map<Integer, Double> zoneTime = new HashMap<>();
        if (powerStream.length == 0 || movingSeconds <= 0) return zoneTime;

        double secPerSample = (double) movingSeconds / powerStream.length;
        double ftp = ftpWatts;

        for (int p : powerStream) {
            if (p < 0) continue;
            double pct = (p / ftp) * 100.0;
            int zone;
            if (pct < 55) zone = 1;
            else if (pct < 75) zone = 2;
            else if (pct < 90) zone = 3;
            else if (pct < 105) zone = 4;
            else if (pct < 120) zone = 5;
            else if (pct < 150) zone = 6;
            else zone = 7;
            zoneTime.merge(zone, secPerSample / 60.0, Double::sum);
        }
        return zoneTime;
    }

    private int zoneForPowerPct(double pct) {
        if (pct < 55) return 1;
        if (pct < 75) return 2;
        if (pct < 90) return 3;
        if (pct < 105) return 4;
        if (pct < 120) return 5;
        if (pct < 150) return 6;
        return 7;
    }

    private double medianPowerPctFtp(int[] power, double ftp) {
        int[] sorted = power.clone();
        java.util.Arrays.sort(sorted);
        double median = sorted.length > 0 ? sorted[sorted.length / 2] : 0;
        return ftp > 0 ? median / ftp * 100.0 : 0;
    }

    private String benefitFromZone(int zone, double durationHours) {
        if (zone == 1 && durationHours < 1.5) return "RECOVERY";
        if (zone == 1) return "ENDURANCE";
        return switch (zone) {
            case 2 -> "ENDURANCE";
            case 3 -> "TEMPO";
            case 4 -> "THRESHOLD";
            case 5 -> "VO2MAX";
            case 6 -> "ANAEROBIC";
            case 7 -> "SPRINT";
            default -> "ENDURANCE";
        };
    }

    // ── TE label helpers ──

    private String aerobicTeLabel(BigDecimal te) {
        double v = te.doubleValue();
        if (v < 1.0) return "Brak";
        if (v < 2.0) return "Regeneracja";
        if (v < 3.0) return "Podtrzymanie";
        if (v < 4.0) return "Poprawa";
        if (v < 5.0) return "Duża poprawa";
        return "Przeciążenie";
    }

    private String anaerobicTeLabel(BigDecimal te) {
        double v = te.doubleValue();
        if (v < 1.0) return "Brak";
        if (v < 2.0) return "Minimalny";
        if (v < 3.0) return "Podtrzymanie";
        if (v < 4.0) return "Poprawa";
        if (v < 5.0) return "Duża poprawa";
        return "Przeciążenie";
    }

    // ── TSS / IF / VI estimation from raw data ──

    private double estimateTss(Activity activity, short ftpWatts) {
        int[] power = activity.getPowerStream();
        Integer movingSec = activity.getMovingTimeSec();
        if (power == null || power.length == 0) {
            if (activity.getAvgPowerW() != null && movingSec != null && movingSec > 0) {
                double ifVal = activity.getAvgPowerW() / (double) ftpWatts;
                return (movingSec / 3600.0) * ifVal * ifVal * 100.0;
            }
            return 30;
        }
        double np = computeNormalizedPower(power);
        if (np <= 0) return 30;
        double intensity = np / ftpWatts;
        double hours = (movingSec != null ? movingSec : power.length) / 3600.0;
        return hours * intensity * intensity * 100.0;
    }

    private double estimateIf(Activity activity, short ftpWatts) {
        int[] power = activity.getPowerStream();
        if (power == null || power.length == 0) {
            return activity.getAvgPowerW() != null ? activity.getAvgPowerW() / (double) ftpWatts : 0.70;
        }
        double np = computeNormalizedPower(power);
        return np > 0 ? np / ftpWatts : 0.70;
    }

    private double estimateVariabilityIndex(Activity activity) {
        int[] power = activity.getPowerStream();
        if (power == null || power.length == 0) return 1.0;
        double np = computeNormalizedPower(power);
        double avg = computeAveragePower(power);
        return avg > 0 ? np / avg : 1.0;
    }

    private double computeNormalizedPower(int[] power) {
        if (power == null || power.length == 0) return 0;
        double[] smoothed = rolling30sAverage(power);
        double sumFourth = 0;
        int count = 0;
        for (double v : smoothed) {
            if (v > 0) {
                sumFourth += Math.pow(v, 4);
                count++;
            }
        }
        return count > 0 ? Math.pow(sumFourth / count, 0.25) : 0;
    }

    private double computeAveragePower(int[] power) {
        if (power == null || power.length == 0) return 0;
        long sum = 0;
        int count = 0;
        for (int p : power) {
            if (p > 0) {
                sum += p;
                count++;
            }
        }
        return count > 0 ? (double) sum / count : 0;
    }

    private double[] rolling30sAverage(int[] power) {
        double[] result = new double[power.length];
        for (int i = 0; i < power.length; i++) {
            double sum = 0;
            int count = 0;
            for (int j = Math.max(0, i - 14); j <= Math.min(power.length - 1, i + 15); j++) {
                if (power[j] > 0) {
                    sum += power[j];
                    count++;
                }
            }
            result[i] = count > 0 ? sum / count : 0;
        }
        return result;
    }

    // ── Peak power bonus for anaerobic TE ──

    private double computePeakPowerBonus(int[] power, short ftpWatts, int movingSeconds) {
        double ftp = ftpWatts;
        double peak5 = bestMeanMaxPower(power, movingSeconds, 5) / ftp;
        double peak15 = bestMeanMaxPower(power, movingSeconds, 15) / ftp;
        double peak30 = bestMeanMaxPower(power, movingSeconds, 30) / ftp;
        double peak60 = bestMeanMaxPower(power, movingSeconds, 60) / ftp;

        return 1.0
                + Math.max(0, (peak5 - 2.0) * 0.2)
                + Math.max(0, (peak15 - 1.8) * 0.15)
                + Math.max(0, (peak30 - 1.5) * 0.1)
                + Math.max(0, (peak60 - 1.2) * 0.05);
    }

    private double bestMeanMaxPower(int[] power, int movingSeconds, int durationSec) {
        if (power == null || power.length == 0) return 0;
        int window = Math.min(durationSec, movingSeconds);
        if (window <= 0) return 0;
        double bestSum = 0;
        double currentSum = 0;
        for (int i = 0; i < Math.min(window, power.length); i++) {
            if (power[i] > 0) currentSum += power[i];
        }
        bestSum = currentSum;
        for (int i = window; i < power.length; i++) {
            if (power[i - window] > 0) currentSum -= power[i - window];
            if (power[i] > 0) currentSum += power[i];
            if (currentSum > bestSum) bestSum = currentSum;
        }
        return bestSum / Math.max(window, 1);
    }

    // ── EPOC → TE mapping ──

    private double epocToTe(double rawEpoc) {
        if (rawEpoc < 10) return Math.max(0, rawEpoc / 10.0);
        if (rawEpoc < 25) return 1.0 + (rawEpoc - 10) / 15.0;
        if (rawEpoc < 50) return 2.0 + (rawEpoc - 25) / 25.0;
        if (rawEpoc < 80) return 3.0 + (rawEpoc - 50) / 30.0;
        return Math.min(5.0, 4.0 + (rawEpoc - 80) / 40.0);
    }

    private double anaerobicEpocToTe(double raw) {
        if (raw < 2) return Math.max(0, raw / 2.0);
        if (raw < 8) return 1.0 + (raw - 2) / 6.0;
        if (raw < 20) return 2.0 + (raw - 8) / 12.0;
        if (raw < 40) return 3.0 + (raw - 20) / 20.0;
        if (raw < 70) return 4.0 + (raw - 40) / 30.0;
        return Math.min(5.0, 4.0 + (raw - 70) / 30.0);
    }

    // ── TSB resolution ──

    private BigDecimal resolveTsb(DailySummary daySummary) {
        return null; // TSB is computed externally via PMC; caller should provide or we use 0
    }

    // ── Stats helpers ──

    private double coefficientOfVariationInt(int[] values) {
        if (values == null || values.length < 2) return 0;
        double sum = 0;
        for (int v : values) sum += v;
        double mean = sum / values.length;
        if (mean == 0) return 0;
        double sqSum = 0;
        for (int v : values) sqSum += Math.pow(v - mean, 2);
        double std = Math.sqrt(sqSum / values.length);
        return std / mean;
    }
}
