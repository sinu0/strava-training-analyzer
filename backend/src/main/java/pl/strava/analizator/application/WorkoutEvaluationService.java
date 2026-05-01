package pl.strava.analizator.application;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
}
