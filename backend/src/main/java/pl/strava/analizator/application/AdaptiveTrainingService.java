package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import pl.strava.analizator.application.dto.AdaptiveTrainingRequest;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.FatigueSignalsDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.PlannedWorkoutDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.ProgressionStateDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.RecentWorkoutDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.TrainingLoadStateDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingResponse;
import pl.strava.analizator.application.dto.AdaptiveTrainingResponse.NewWorkoutDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingResponse.StrategyDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingResponse.WorkoutAdjustmentDto;

@Service
public class AdaptiveTrainingService {

    private static final double ATL_HIGH_THRESHOLD = 85.0;
    private static final double TSB_STRONGLY_NEGATIVE = -15.0;
    private static final double TSB_NEGATIVE = -5.0;
    private static final double OVERACHIEVE_SCORE = 90.0;
    private static final double FAIL_SCORE = 40.0;
    private static final int MAX_HIGH_INTENSITY_PER_WEEK = 3;
    private static final int MAX_CONSECUTIVE_HARD_DAYS = 2;

    public AdaptiveTrainingResponse adapt(AdaptiveTrainingRequest request) {
        List<PlannedWorkoutDto> planned = request.getPlannedWorkouts();
        List<RecentWorkoutDto> recent = request.getRecentWorkouts();
        TrainingLoadStateDto load = request.getTrainingLoad();
        FatigueSignalsDto signals = request.getFatigueSignals();
        ProgressionStateDto progression = request.getProgressionState();

        // 1. Fatigue Assessment
        String fatigueState = assessFatigue(load, signals);

        // 2. Performance Assessment
        String performanceTrend = assessPerformance(recent);

        // 3. Determine progression action
        String progressionAction = determineProgressionAction(fatigueState, performanceTrend, recent, progression);

        // 4. Generate warnings
        List<String> warnings = generateWarnings(fatigueState, performanceTrend, load, signals, planned);

        // 5. Generate adjustments for each planned workout
        List<WorkoutAdjustmentDto> adjustments = generateAdjustments(planned, fatigueState, performanceTrend, progression, load, signals);

        // 6. Build insight
        String insight = buildInsight(fatigueState, performanceTrend, progressionAction, recent, load);

        StrategyDto strategy = StrategyDto.builder()
                .fatigueState(fatigueState)
                .performanceTrend(performanceTrend)
                .progressionAction(progressionAction)
                .build();

        return AdaptiveTrainingResponse.builder()
                .adjustments(adjustments)
                .strategy(strategy)
                .warnings(warnings)
                .insight(insight)
                .build();
    }

    // ---- FATIGUE ASSESSMENT ----

    private String assessFatigue(TrainingLoadStateDto load, FatigueSignalsDto signals) {
        double atl = (load != null && load.getAtl() != null) ? load.getAtl().doubleValue() : 0;
        double tsb = (load != null && load.getTsb() != null) ? load.getTsb().doubleValue() : 0;
        String hrv = (signals != null && signals.getHrvTrend() != null) ? signals.getHrvTrend().toUpperCase(Locale.ROOT) : "STABLE";
        int readiness = (signals != null) ? signals.getSubjectiveReadiness() : 50;

        int highSignals = 0;
        int lowSignals = 0;

        if (atl > ATL_HIGH_THRESHOLD) highSignals++;
        if (tsb < TSB_STRONGLY_NEGATIVE) highSignals++;
        if ("DOWN".equals(hrv)) highSignals++;
        if ("DOWN".equalsIgnoreCase(signals != null ? signals.getRestingHrTrend() : null)) highSignals++;
        if ("POOR".equalsIgnoreCase(signals != null ? signals.getSleepQuality() : null)) highSignals++;
        if (readiness < 40) highSignals++;

        if (tsb > 5) lowSignals++;
        if ("UP".equals(hrv)) lowSignals++;
        if ("UP".equalsIgnoreCase(signals != null ? signals.getRestingHrTrend() : null)) lowSignals++;
        if ("GOOD".equalsIgnoreCase(signals != null ? signals.getSleepQuality() : null)) lowSignals++;
        if (readiness > 70) lowSignals++;

        if (highSignals >= 2) return "HIGH";
        if (lowSignals >= 1 && highSignals == 0) return "LOW";
        if (highSignals >= 1 && lowSignals >= 1) {
            if (tsb < TSB_STRONGLY_NEGATIVE || atl > ATL_HIGH_THRESHOLD) return "HIGH";
            return "MODERATE";
        }
        return "MODERATE";
    }

    // ---- PERFORMANCE ASSESSMENT ----

    private String assessPerformance(List<RecentWorkoutDto> recent) {
        if (recent == null || recent.isEmpty()) return "MIXED";

        int success = 0;
        int fail = 0;
        for (RecentWorkoutDto r : recent) {
            String outcome = r.getOutcome() != null ? r.getOutcome().toUpperCase(Locale.ROOT) : "PARTIAL";
            if ("SUCCESS".equals(outcome) || "OVERACHIEVE".equals(outcome)) success++;
            if ("FAIL".equals(outcome)) fail++;
        }

        if (success >= recent.size() - 1 && fail == 0) return "SUCCESS";
        if (fail >= 2) return "FAIL";
        if (success > fail) return "MIXED";
        if (fail > success) return "FAIL";
        return "MIXED";
    }

    // ---- PROGRESSION ACTION ----

    private String determineProgressionAction(
            String fatigueState,
            String performanceTrend,
            List<RecentWorkoutDto> recent,
            ProgressionStateDto progression) {
        if ("HIGH".equals(fatigueState)) return "MAINTAIN";
        if ("FAIL".equals(performanceTrend)) return "REGRESS";
        if ("SUCCESS".equals(performanceTrend)) {
            boolean hasOverachieve = recent != null && recent.stream()
                    .anyMatch(r -> "OVERACHIEVE".equalsIgnoreCase(r.getOutcome()));
            if (hasOverachieve && !"LOW".equals(fatigueState)) return "MAINTAIN";
            return "PROGRESS";
        }
        return "MAINTAIN";
    }

    // ---- WARNINGS ----

    private List<String> generateWarnings(
            String fatigueState,
            String performanceTrend,
            TrainingLoadStateDto load,
            FatigueSignalsDto signals,
            List<PlannedWorkoutDto> planned) {
        List<String> warnings = new ArrayList<>();

        if ("HIGH".equals(fatigueState)) {
            warnings.add("Wysoki poziom zmeczenia - priorytetem jest regeneracja.");
        }
        if ("FAIL".equals(performanceTrend)) {
            warnings.add("Trend wykonania spadkowy - rozwaz regresje obciazen.");
        }

        if (load != null) {
            double tsb = load.getTsb() != null ? load.getTsb().doubleValue() : 0;
            if (tsb < -25) {
                warnings.add("TSB ponizej -25 - ryzyko przetrenowania jest wysokie.");
            }

            double atl = load.getAtl() != null ? load.getAtl().doubleValue() : 0;
            double ctl = load.getCtl() != null ? load.getCtl().doubleValue() : 0;
            if (ctl > 0 && atl / ctl > 1.35) {
                warnings.add("Stosunek ATL/CTL powyzej 1.35 - zmeczenie dominuje nad forma.");
            }
        }

        if (planned != null) {
            int hardCount = 0;
            for (PlannedWorkoutDto w : planned) {
                if (isHardType(w.getType())) hardCount++;
            }
            if (hardCount > MAX_HIGH_INTENSITY_PER_WEEK) {
                warnings.add("Za duzo sesji o wysokiej intensywnosci w tygodniu (>" + MAX_HIGH_INTENSITY_PER_WEEK + ").");
            }
        }

        return warnings;
    }

    // ---- WORKOUT ADJUSTMENTS ----

    private List<WorkoutAdjustmentDto> generateAdjustments(
            List<PlannedWorkoutDto> planned,
            String fatigueState,
            String performanceTrend,
            ProgressionStateDto progression,
            TrainingLoadStateDto load,
            FatigueSignalsDto signals) {
        List<WorkoutAdjustmentDto> adjustments = new ArrayList<>();
        if (planned == null || planned.isEmpty()) return adjustments;

        LocalDate startDate = LocalDate.now().plusDays(1);
        int consecutiveHard = 0;

        for (int i = 0; i < planned.size(); i++) {
            PlannedWorkoutDto w = planned.get(i);
            LocalDate day = startDate.plusDays(i);
            String dateStr = day.toString();

            String action = "KEEP";
            String reason = "Plan zgodny z aktualnym stanem.";
            String newType = w.getType() != null ? w.getType() : "ENDURANCE";
            String intensityAdj = "SAME";
            String volumeAdj = "SAME";

            if ("HIGH".equals(fatigueState) && isHardType(w.getType())) {
                action = "REPLACE";
                reason = "Wysokie zmeczenie - sesja progowa/VO2 zastapiona regeneracja lub wytrzymaloscia.";
                newType = consecutiveHard > 0 ? "RECOVERY" : "ENDURANCE";
                intensityAdj = "DOWN";
                volumeAdj = "DOWN";
            } else if ("FAIL".equals(performanceTrend)) {
                if (isHardType(w.getType())) {
                    action = "MODIFY";
                    reason = "Trend wykonania spadkowy - obniz intensywnosc i/lub liczbe interwalow.";
                    intensityAdj = "DOWN";
                    volumeAdj = "DOWN";
                    newType = toEasierType(w.getType());
                }
            } else if ("SUCCESS".equals(performanceTrend) && !"HIGH".equals(fatigueState)) {
                if (isHardType(w.getType())) {
                    boolean hasOverachieve = hasRecentOverachieve(null);
                    if (hasOverachieve && !"LOW".equals(fatigueState)) {
                        action = "KEEP";
                        reason = "Overachieve przy rosnacym zmeczeniu - stabilizuj obciazenie.";
                    } else {
                        action = "MODIFY";
                        reason = "Stabilny sukces - progresywne zwiekszenie obciazenia.";
                        intensityAdj = "UP";
                        volumeAdj = "SAME";
                    }
                }
            }

            if (isHardType(newType)) consecutiveHard++;
            else consecutiveHard = 0;

            if (consecutiveHard > MAX_CONSECUTIVE_HARD_DAYS && isHardType(newType)) {
                action = "REPLACE";
                reason = "Zbyt wiele ciezki dni z rzedu - zastap tlenem.";
                newType = "ENDURANCE";
                intensityAdj = "DOWN";
                volumeAdj = "SAME";
            }

            NewWorkoutDto newWorkout = NewWorkoutDto.builder()
                    .type(newType)
                    .intensityAdjustment(intensityAdj)
                    .volumeAdjustment(volumeAdj)
                    .build();

            adjustments.add(WorkoutAdjustmentDto.builder()
                    .day(dateStr)
                    .action(action)
                    .reason(reason)
                    .newWorkout(newWorkout)
                    .build());

            if (!isHardType(newType)) consecutiveHard = 0;
        }

        return adjustments;
    }

    // ---- INSIGHT ----

    private String buildInsight(
            String fatigueState,
            String performanceTrend,
            String progressionAction,
            List<RecentWorkoutDto> recent,
            TrainingLoadStateDto load) {
        StringBuilder sb = new StringBuilder();

        Map<String, String> fatigueLabel = Map.of(
                "LOW", "Niskie zmeczenie - dobra gotowosc do treningu.",
                "MODERATE", "Umiarkowane zmeczenie - kontroluj obciazenie i pilnuj regeneracji.",
                "HIGH", "Wysokie zmeczenie - priorytetem jest redukcja obciazenia i odbudowa swiezosci."
        );
        sb.append(fatigueLabel.getOrDefault(fatigueState, ""));

        Map<String, String> perfLabel = Map.of(
                "SUCCESS", " Ostatnie treningi wykonane zgodnie z planem.",
                "MIXED", " Wyniki treningow mieszane - czesciowo zgodne z planem.",
                "FAIL", " Trend wykonania spadkowy - potrzebna korekta."
        );
        sb.append(perfLabel.getOrDefault(performanceTrend, ""));

        Map<String, String> progLabel = Map.of(
                "PROGRESS", " Plan zawiera umiarkowana progresje obciazen.",
                "MAINTAIN", " Utrzymanie aktualnego poziomu obciazen.",
                "REGRESS", " Obciazenie zredukowane aby umozliwic adaptacje i regeneracje."
        );
        sb.append(progLabel.getOrDefault(progressionAction, ""));

        return sb.toString();
    }

    // ---- HELPERS ----

    private boolean isHardType(String type) {
        if (type == null) return false;
        String upper = type.toUpperCase(Locale.ROOT);
        return "VO2_MAX".equals(upper)
                || "THRESHOLD".equals(upper)
                || "ANAEROBIC".equals(upper)
                || "VO2MAX".equals(upper);
    }

    private String toEasierType(String type) {
        if (type == null) return "ENDURANCE";
        return switch (type.toUpperCase(Locale.ROOT)) {
            case "VO2_MAX", "VO2MAX", "ANAEROBIC" -> "THRESHOLD";
            case "THRESHOLD" -> "ENDURANCE";
            default -> "ENDURANCE";
        };
    }

    private boolean hasRecentOverachieve(List<RecentWorkoutDto> recent) {
        if (recent == null) return false;
        return recent.stream().anyMatch(r -> "OVERACHIEVE".equalsIgnoreCase(r.getOutcome()));
    }
}
