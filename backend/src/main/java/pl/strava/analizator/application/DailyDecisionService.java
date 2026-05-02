package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.DailyDecisionDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.AlternativeOptionDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.ConfidenceScoreDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.DecisionReasonDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.WorkoutSuggestionDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.domain.model.DailyDecision;
import pl.strava.analizator.domain.model.DailyDecisionEngine;
import pl.strava.analizator.domain.model.DailyDecisionEngine.DecisionInput;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.model.TrainingDayEnvironment;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.port.TrainingDayEnvironmentPort;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Service
@RequiredArgsConstructor
public class DailyDecisionService {

    private final DailyDecisionEngine engine = new DailyDecisionEngine();
    private final AnalyticsService analyticsService;
    private final TrainingPlanRepository trainingPlanRepository;
    private final TrainingDayEnvironmentPort trainingDayEnvironmentPort;
    private final DailySummaryRepository dailySummaryRepository;

    public DailyDecisionDto getDailyDecision() {
        LocalDate today = LocalDate.now();

        ReadinessDto readiness = analyticsService.getReadiness();
        List<TrainingPlan> todayPlans = trainingPlanRepository.findByDateRange(today, today);
        Optional<TrainingDayEnvironment> environment = trainingDayEnvironmentPort.getEnvironmentFor(today);

        TrainingPlan plan = todayPlans.isEmpty() ? null : todayPlans.get(0);

        DailyDecisionEngine.DecisionInput.DecisionInputBuilder inputBuilder = DecisionInput.builder();

        if (readiness != null) {
            inputBuilder
                    .readinessScore(BigDecimal.valueOf(readiness.getScore()))
                    .ctl(BigDecimal.valueOf(readiness.getCtl()))
                    .atl(BigDecimal.valueOf(readiness.getAtl()))
                    .tsb(BigDecimal.valueOf(readiness.getTsb()));
        }

        String hrvTrend = computeHrvTrend(today);
        boolean hasHrvData = hrvTrend != null;
        inputBuilder.hrvTrend(hrvTrend).hasHrvData(hasHrvData);

        int weatherScore = 50;
        String weatherDesc = "Unknown";
        boolean hasWeatherData = false;
        if (environment.isPresent()) {
            TrainingDayEnvironment env = environment.get();
            weatherScore = env.getOutdoorScore();
            weatherDesc = env.getWeatherDescription();
            hasWeatherData = true;
        }
        inputBuilder.weatherScore(weatherScore)
                .weatherDescription(weatherDesc)
                .hasWeatherData(hasWeatherData);

        if (plan != null) {
            inputBuilder
                    .plannedType(resolveType(plan.getPlannedType()))
                    .plannedTss(plan.getPlannedTss())
                    .plannedDurationMin(plan.getPlannedDurationMin());
        } else {
            inputBuilder.plannedType(null).plannedTss(null).plannedDurationMin(null);
        }

        inputBuilder.timeAvailableMin(null);

        BigDecimal recentOutcomeRatio = computeRecentOutcomeRatio(today);
        inputBuilder.recentOutcomeRatio(recentOutcomeRatio)
                .hasRecentActivities(recentOutcomeRatio != null);

        DailyDecision decision = engine.evaluate(inputBuilder.build());
        return toDto(decision);
    }

    private BigDecimal computeRecentOutcomeRatio(LocalDate today) {
        LocalDate from = today.minusDays(14);
        List<TrainingPlan> recent = trainingPlanRepository.findByDateRange(from, today);

        if (recent.isEmpty()) return null;

        long completed = recent.stream()
                .filter(p -> p.getStatus() != null
                        && (p.getStatus().name().equals("COMPLETED")
                        || p.getStatus().name().equals("PARTIAL")))
                .count();

        return BigDecimal.valueOf((double) completed / recent.size())
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String computeHrvTrend(LocalDate today) {
        LocalDate from = today.minusDays(7);
        DateRange range = DateRange.of(from, today);
        List<DailySummary> summaries = dailySummaryRepository.findByDateRange(range);

        List<DailySummary> withHrv = summaries.stream()
                .filter(s -> s.getHrvRmssd() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .toList();

        if (withHrv.size() < 3) return null;

        BigDecimal first = withHrv.get(0).getHrvRmssd();
        BigDecimal last = withHrv.get(withHrv.size() - 1).getHrvRmssd();
        BigDecimal change = last.subtract(first);

        if (change.compareTo(BigDecimal.valueOf(3)) > 0) return "IMPROVING";
        if (change.compareTo(BigDecimal.valueOf(-3)) < 0) return "DECLINING";
        return "STABLE";
    }

    private String resolveType(String plannedType) {
        if (plannedType == null) return null;
        String upper = plannedType.toUpperCase(java.util.Locale.ROOT);
        if (upper.contains("INTERVAL") || upper.contains("VO2") || upper.contains("VO2MAX")) return "VO2MAX";
        if (upper.contains("THRESHOLD") || upper.contains("FTP") || upper.contains("SWEET")) return "THRESHOLD";
        if (upper.contains("TEMPO")) return "TEMPO";
        if (upper.contains("RECOVERY") || upper.contains("REST")) return "RECOVERY";
        if (upper.contains("ENDURANCE") || upper.contains("LONG")) return "ENDURANCE";
        return "ENDURANCE";
    }

    private DailyDecisionDto toDto(DailyDecision decision) {
        return DailyDecisionDto.builder()
                .decision(decision.getDecision().name())
                .workout(toWorkoutDto(decision.getWorkout()))
                .confidence(toConfidenceDto(decision.getConfidence()))
                .risk(decision.getRisk().name())
                .reasons(decision.getReasons().stream().map(r ->
                        DecisionReasonDto.builder()
                                .priority(r.getPriority())
                                .signal(r.getSignal())
                                .message(r.getMessage())
                                .evidence(r.getEvidence())
                                .build()
                ).toList())
                .alternatives(decision.getAlternatives().stream().map(a ->
                        AlternativeOptionDto.builder()
                                .label(a.getLabel())
                                .type(a.getType().name())
                                .workout(toWorkoutDto(a.getWorkout()))
                                .rationale(a.getRationale())
                                .build()
                ).toList())
                .build();
    }

    private WorkoutSuggestionDto toWorkoutDto(pl.strava.analizator.domain.model.WorkoutSuggestion ws) {
        if (ws == null) return null;
        return WorkoutSuggestionDto.builder()
                .type(ws.getType())
                .durationMin(ws.getDurationMin())
                .targetTss(ws.getTargetTss())
                .difficulty(ws.getDifficulty())
                .intensityDescription(ws.getIntensityDescription())
                .description(ws.getDescription())
                .indoor(ws.isIndoor())
                .build();
    }

    private ConfidenceScoreDto toConfidenceDto(pl.strava.analizator.domain.model.ConfidenceScore cs) {
        if (cs == null) return null;
        return ConfidenceScoreDto.builder()
                .score(cs.getScore())
                .label(cs.getLabel())
                .description(cs.getDescription())
                .build();
    }
}
