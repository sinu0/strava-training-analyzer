package pl.strava.analizator.application.ai;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.BlockHealthService;
import pl.strava.analizator.application.TrainingPlanService;
import pl.strava.analizator.application.dto.BlockHealthDto;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.DurabilityInsightDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.ReadinessSessionVariantDto;
import pl.strava.analizator.application.dto.TrainingGoalScorecardDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.application.dto.TrainingWeekObjectiveDto;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.TrainingContext;
import pl.strava.analizator.domain.ai.TrainingDataPort;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AiPredictionRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.vo.DateRange;

/**
 * Reads historical training data from existing repositories/services
 * and builds a TrainingContext for LLM consumption.
 */
@Component
@RequiredArgsConstructor
public class TrainingDataAdapter implements TrainingDataPort {

    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final AiPredictionRepository aiPredictionRepository;
    private final AnalyticsService analyticsService;
    private final BlockHealthService blockHealthService;
    private final TrainingPlanService trainingPlanService;

    @Override
    public TrainingContext buildContext(PredictionType predictionType) {
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        int daysBack = getDaysBack(predictionType);

        OffsetDateTime from = OffsetDateTime.now(ZoneOffset.UTC).minusDays(daysBack);
        OffsetDateTime to = OffsetDateTime.now(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to);

        return TrainingContext.builder()
                .athleteProfile(formatProfile(profile))
                .timeContext(buildTimeContext())
                .recentActivities(formatActivities(activities))
                .pmcData(buildPmcData(daysBack))
                .ftpHistory(buildFtpHistory())
                .weeklyVolume(buildWeeklyVolume())
                .zoneDistribution(buildZoneDistribution(activities))
                .readiness(buildReadiness())
                .powerCurve(buildPowerCurve(activities))
                .durability(buildDurability())
                .progressionLevels(buildProgressionLevels())
                .blockHealth(buildBlockHealth())
                .programReview(buildProgramReview())
                .coachSummary(buildCoachSummary())
                .coachMemory(buildCoachMemory())
                .recentPredictionHistory(buildPredictionHistory(predictionType))
                .build();
    }

    private int getDaysBack(PredictionType type) {
        return switch (type) {
            case TRAINING_TYPE_RECOMMENDATION -> 7;
            case FATIGUE_PREDICTION -> 14;
            case FTP_PREDICTION, OVERTRAINING_RISK -> 30;
            case PERFORMANCE_TREND -> 60;
            case RACE_READINESS -> 21;
            case TRAINING_COACH_SUMMARY -> 28;
        };
    }

    private String formatProfile(AthleteProfile profile) {
        if (profile == null) return "No profile data available";
        // Use profile FTP if manually set; otherwise fall back to estimated FTP from daily metrics
        String ftpLabel;
        if (profile.getFtpWatts() != null) {
            ftpLabel = profile.getFtpWatts() + "W (manually set)";
        } else {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            Map<LocalDate, BigDecimal> ftpSeries = dailyMetricRepository.findNumericSeries(
                    "ftp", DateRange.of(today.minusDays(7), today));
            if (!ftpSeries.isEmpty()) {
                BigDecimal latest = ftpSeries.values().stream()
                        .reduce((a, b) -> b).orElse(BigDecimal.ZERO);
                ftpLabel = Math.round(latest.doubleValue()) + "W (estimated from power curves)";
            } else {
                ftpLabel = "unknown";
            }
        }
        return String.format("FTP: %s, Weight: %s kg, Max HR: %s bpm, LTHR: %s bpm",
                ftpLabel,
                profile.getWeightKg() != null ? profile.getWeightKg() : "unknown",
                profile.getMaxHrBpm() != null ? profile.getMaxHrBpm() : "unknown",
                profile.getLthrBpm() != null ? profile.getLthrBpm() : "unknown");
    }

    private List<String> formatActivities(List<Activity> activities) {
        return activities.stream()
                .sorted(java.util.Comparator.comparing(Activity::getStartedAt,
                        java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .map(a -> {
                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("[%s, %s] %s — %s",
                            a.getStartedAt() != null ? a.getStartedAt().toLocalDate() : "?",
                            formatDaysAgo(a.getStartedAt()),
                            a.getSportType(),
                            a.getName() != null ? a.getName() : "Unnamed"));
                    if (a.getMovingTimeSec() != null) {
                        sb.append(String.format(", Duration: %dmin", a.getMovingTimeSec() / 60));
                    }
                    if (a.getDistanceM() != null) {
                        sb.append(String.format(", Distance: %.1fkm", a.getDistanceM().doubleValue() / 1000));
                    }
                    if (a.getAvgPowerW() != null) {
                        sb.append(String.format(", Avg Power: %dW", a.getAvgPowerW()));
                    }
                    if (a.getAvgHeartrate() != null) {
                        sb.append(String.format(", Avg HR: %dbpm", a.getAvgHeartrate()));
                    }
                    if (a.getElevationGainM() != null) {
                        sb.append(String.format(", Elevation: %.0fm", a.getElevationGainM().doubleValue()));
                    }

                    // Add computed metrics if available
                    List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(a.getId());
                    for (MetricResult m : metrics) {
                        if (m.isNumeric() && isRelevantMetric(m.getMetricName())) {
                            sb.append(String.format(", %s: %.1f",
                                    displayMetricName(m.getMetricName()),
                                    m.getNumericValue().doubleValue()));
                        }
                    }
                    return sb.toString();
                })
                .collect(Collectors.toList());
    }

    private String buildTimeContext() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate currentWeekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return "Today (UTC): " + today
                + ", current week starts: " + currentWeekStart
                + ". Treat activity dates as historical context — older sessions are not happening now. "
                + "Weight the newest sessions most heavily when making recommendations.";
    }

    private boolean isRelevantMetric(String name) {
        return name.equals("training_stress_score") || name.equals("tss")
            || name.equals("normalized_power") || name.equals("np")
            || name.equals("intensity_factor") || name.equals("if")
            || name.equals("efficiency_factor") || name.equals("ef")
            || name.equals("aerobic_decoupling");
    }

    private Map<String, Object> buildPmcData(int daysBack) {
        Map<String, Object> pmc = new HashMap<>();
        LocalDate from = LocalDate.now().minusDays(daysBack);
        LocalDate to = LocalDate.now();
        DateRange range = DateRange.of(from, to);

        Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", range);
        Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", range);
        Map<LocalDate, BigDecimal> tsbSeries = dailyMetricRepository.findNumericSeries("tsb", range);

        pmc.put("currentCTL", ctlSeries.getOrDefault(to, BigDecimal.ZERO));
        pmc.put("currentATL", atlSeries.getOrDefault(to, BigDecimal.ZERO));
        pmc.put("currentTSB", tsbSeries.getOrDefault(to, BigDecimal.ZERO));

        // Include trend: last 7 data points
        pmc.put("ctlLast7Days", lastNEntries(ctlSeries, 7));
        pmc.put("atlLast7Days", lastNEntries(atlSeries, 7));
        pmc.put("tsbLast7Days", lastNEntries(tsbSeries, 7));

        return pmc;
    }

    private Map<String, Object> lastNEntries(Map<LocalDate, BigDecimal> series, int n) {
        Map<String, Object> result = new HashMap<>();
        series.entrySet().stream()
                .sorted(Map.Entry.<LocalDate, BigDecimal>comparingByKey().reversed())
                .limit(n)
                .forEach(e -> result.put(e.getKey().toString(), e.getValue()));
        return result;
    }

    private Map<String, Object> buildFtpHistory() {
        // Read from daily metrics if FTP history data exists
        Map<String, Object> history = new HashMap<>();
        LocalDate from = LocalDate.now().minusDays(365);
        DateRange range = DateRange.of(from, LocalDate.now());
        Map<LocalDate, BigDecimal> ftpSeries = dailyMetricRepository.findNumericSeries("ftp", range);
        if (!ftpSeries.isEmpty()) {
            history.put("ftpHistory", ftpSeries.entrySet().stream()
                    .collect(Collectors.toMap(e -> e.getKey().toString(), Map.Entry::getValue)));
        }
        return history;
    }

    private Map<String, Object> buildWeeklyVolume() {
        Map<String, Object> volume = new HashMap<>();
        LocalDate from = LocalDate.now().minusWeeks(8);
        DateRange range = DateRange.of(from, LocalDate.now());

        Map<LocalDate, BigDecimal> tssSeries = dailyMetricRepository.findNumericSeries("daily_tss", range);
        volume.put("dailyTssLast8Weeks", tssSeries.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().toString(), Map.Entry::getValue)));
        List<Map<String, Object>> weeklyTssByWeek = buildWeeklyTssByWeek(tssSeries);
        volume.put("weeklyTssByWeek", weeklyTssByWeek);
        volume.put("currentWeekTss", weeklyTssByWeek.isEmpty()
                ? BigDecimal.ZERO
                : extractWeeklyTss(weeklyTssByWeek, weeklyTssByWeek.size() - 1));
        volume.put("previousWeekTss", weeklyTssByWeek.size() < 2
                ? BigDecimal.ZERO
                : extractWeeklyTss(weeklyTssByWeek, weeklyTssByWeek.size() - 2));
        return volume;
    }

    private Map<String, Object> buildDurability() {
        DurabilityInsightDto durability = analyticsService.getDurabilityInsights();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("trend", durability.getTrend());
        result.put("label", durability.getLabel());
        result.put("description", durability.getDescription());
        result.put("avgAerobicDecoupling", durability.getAvgAerobicDecoupling());
        result.put("avgPowerFade", durability.getAvgPowerFade());
        result.put("avgDurabilityScore", durability.getAvgDurabilityScore());
        result.put("recentDurabilityWorkouts", durability.getWorkouts().stream().map(workout -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", workout.getDate());
            row.put("name", workout.getName());
            row.put("durationMin", workout.getDurationMin());
            row.put("tss", workout.getTss());
            row.put("aerobicDecoupling", workout.getAerobicDecoupling());
            row.put("powerFade", workout.getPowerFade());
            row.put("durabilityScore", workout.getDurabilityScore());
            return row;
        }).toList());
        return result;
    }

    private Map<String, Object> buildProgramReview() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<TrainingPlanProgramDto> programs = trainingPlanService.getPrograms();
        TrainingPlanProgramDto currentProgram = programs.stream()
                .filter(program -> !today.isBefore(program.getStartDate()) && !today.isAfter(program.getEndDate()))
                .findFirst()
                .orElse(null);

        if (currentProgram == null) {
            return Map.of();
        }

        TrainingWeekObjectiveDto currentObjective = currentProgram.getWeeklyObjectives().stream()
                .filter(objective -> !today.isBefore(objective.getWeekStart()) && !today.isAfter(objective.getWeekEnd()))
                .findFirst()
                .orElse(null);
        TrainingGoalScorecardDto currentScorecard = currentProgram.getGoalScorecards().stream()
                .filter(scorecard -> !today.isBefore(scorecard.getWeekStart()) && !today.isAfter(scorecard.getWeekEnd()))
                .findFirst()
                .orElse(null);
        List<CalendarDayDto> reviewWindow = trainingPlanService.getCalendarView(today.minusDays(3), today.plusDays(7));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("programGoal", currentProgram.getGoal());
        result.put("programPriority", currentProgram.getGoalPriority());
        result.put("objectiveLabel", currentObjective != null ? currentObjective.getLabel() : null);
        result.put("objectiveFocus", currentObjective != null ? currentObjective.getFocus() : null);
        result.put("fuelingLabel", currentObjective != null ? currentObjective.getFuelingLabel() : null);
        result.put("scorecardOnTrack", currentScorecard != null && currentScorecard.isOnTrack());
        result.put("goalFocusLabel", currentScorecard != null ? currentScorecard.getGoalFocusLabel() : null);
        result.put("goalFocusRole", currentScorecard != null ? currentScorecard.getGoalFocusRole() : null);
        result.put("goalExecutionStatus", currentScorecard != null ? currentScorecard.getGoalExecutionStatus() : null);
        result.put("goalExecutionScore", currentScorecard != null ? currentScorecard.getGoalExecutionScore() : null);
        result.put("goalSessions", currentScorecard == null
                ? null
                : "%d/%d".formatted(currentScorecard.getCompletedGoalSessions(), currentScorecard.getPlannedGoalSessions()));
        result.put("avgExecutionScore", currentScorecard != null ? currentScorecard.getAvgExecutionScore() : null);
        result.put("recentExecutions", reviewWindow.stream()
                .filter(day -> day.getExecution() != null)
                .map(day -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date", day.getDate());
                    row.put("label", day.getExecution().getLabel());
                    row.put("score", day.getExecution().getScore());
                    row.put("outcome", day.getExecution().getOutcome());
                    return row;
                })
                .toList());
        result.put("upcomingPlan", reviewWindow.stream()
                .filter(day -> !day.getDate().isBefore(today))
                .filter(day -> day.getPlanned() != null)
                .map(day -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date", day.getDate());
                    row.put("plannedType", day.getPlanned().getPlannedType());
                    row.put("plannedTss", day.getPlanned().getPlannedTss());
                    row.put("projectionDayType", day.getProjection() != null ? day.getProjection().getDayType() : null);
                    row.put("adjustment", day.getAdjustment() != null ? day.getAdjustment().getTitle() : null);
                    return row;
                })
                .toList());
        return result;
    }

    private Map<String, Object> buildProgressionLevels() {
        List<ProgressionLevelDto> progressionLevels = analyticsService.getProgressionLevels();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("systems", progressionLevels.stream().map(level -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("system", level.getSystem());
            row.put("label", level.getLabel());
            row.put("level", level.getLevel());
            row.put("currentLoad", level.getCurrentLoad());
            row.put("previousLoad", level.getPreviousLoad());
            row.put("targetLoad", level.getTargetLoad());
            row.put("trend", level.getTrend());
            row.put("description", level.getDescription());
            row.put("nextRecommendation", level.getNextRecommendation());
            return row;
        }).toList());
        result.put("topFocus", progressionLevels.stream()
                .filter(level -> level.getTargetLoad() != null && level.getCurrentLoad() != null)
                .min(java.util.Comparator.comparing(level -> level.getCurrentLoad()
                        .subtract(level.getTargetLoad())
                        .abs()))
                .map(ProgressionLevelDto::getSystem)
                .orElse(null));
        return result;
    }

    private Map<String, Object> buildBlockHealth() {
        BlockHealthDto blockHealth = blockHealthService.getCurrentBlockHealth();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", blockHealth.getStatus());
        result.put("label", blockHealth.getLabel());
        result.put("description", blockHealth.getDescription());
        result.put("objectiveLabel", blockHealth.getObjectiveLabel());
        result.put("goalExecutionStatus", blockHealth.getGoalExecutionStatus());
        result.put("goalExecutionScore", blockHealth.getGoalExecutionScore());
        result.put("adjustmentDays", blockHealth.getAdjustmentDays());
        result.put("missedStimulusDays", blockHealth.getMissedStimulusDays());
        result.put("overloadDays", blockHealth.getOverloadDays());
        result.put("keySignals", blockHealth.getKeySignals());
        result.put("nextFocus", blockHealth.getNextFocus());
        return result;
    }

    private Map<String, Object> buildCoachSummary() {
        ReadinessDto readiness = analyticsService.getReadiness();
        DurabilityInsightDto durability = analyticsService.getDurabilityInsights();
        List<ProgressionLevelDto> progressionLevels = analyticsService.getProgressionLevels();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<CalendarDayDto> nextDays = trainingPlanService.getCalendarView(today, today.plusDays(6));

        List<String> keyWins = progressionLevels.stream()
                .filter(level -> "UP".equals(level.getTrend()))
                .map(level -> level.getLabel() + " idzie w dobrą stronę.")
                .limit(2)
                .toList();
        List<String> keyRisks = nextDays.stream()
                .filter(day -> day.getAdjustment() != null)
                .map(day -> day.getDate() + ": " + day.getAdjustment().getTitle())
                .limit(2)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("readinessLabel", readiness != null ? readiness.getDayLabel() : null);
        result.put("durabilityTrend", durability != null ? durability.getTrend() : null);
        result.put("progressionFocus", progressionLevels.stream()
                .filter(level -> "DOWN".equals(level.getTrend()) || level.getCurrentLoad().compareTo(level.getTargetLoad()) < 0)
                .map(ProgressionLevelDto::getLabel)
                .toList());
        result.put("autoAdjustedDays", nextDays.stream()
                .filter(day -> day.getAdjustment() != null)
                .map(day -> day.getDate() + " - " + day.getAdjustment().getTitle())
                .toList());
        result.put("keyWins", keyWins);
        result.put("keyRisks", keyRisks.isEmpty() ? List.of("Brak dużych czerwonych flag w najbliższym tygodniu.") : keyRisks);
        result.put("nextFocus", progressionLevels.stream()
                .filter(level -> level.getCurrentLoad().compareTo(level.getTargetLoad()) < 0)
                .map(ProgressionLevelDto::getNextRecommendation)
                .findFirst()
                .orElse("Broń głównego celu tygodnia i nie dokładaj przypadkowej intensywności."));
        return result;
    }

    private Map<String, Object> buildCoachMemory() {
        var summary = trainingPlanService.getCoachMemory();
        return Map.of(
                "headline", summary.getHeadline(),
                "coachNote", summary.getCoachNote(),
                "preferences", summary.getPreferences().stream()
                        .map(preference -> Map.<String, Object>of(
                                "suggestionType", preference.getSuggestionType(),
                                "acceptedCount", preference.getAcceptedCount(),
                                "rejectedCount", preference.getRejectedCount(),
                                "acceptanceRate", preference.getAcceptanceRate(),
                                "guidance", preference.getGuidance()
                        ))
                        .toList()
        );
    }

    private List<Map<String, Object>> buildWeeklyTssByWeek(Map<LocalDate, BigDecimal> tssSeries) {
        Map<LocalDate, BigDecimal> weeklyTotals = new LinkedHashMap<>();
        tssSeries.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    LocalDate weekStart = entry.getKey().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    weeklyTotals.merge(weekStart, entry.getValue(), BigDecimal::add);
                });

        return weeklyTotals.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> week = new LinkedHashMap<>();
                    week.put("weekStart", entry.getKey().toString());
                    week.put("weeklyTss", entry.getValue());
                    return week;
                })
                .toList();
    }

    private static BigDecimal extractWeeklyTss(List<Map<String, Object>> weeklyTssByWeek, int index) {
        if (index < 0 || index >= weeklyTssByWeek.size()) {
            return BigDecimal.ZERO;
        }
        Object value = weeklyTssByWeek.get(index).get("weeklyTss");
        return value instanceof BigDecimal weeklyTss ? weeklyTss : BigDecimal.ZERO;
    }

    private Map<String, Object> buildZoneDistribution(List<Activity> activities) {
        Map<String, Object> zones = new HashMap<>();
        // Aggregate zone time from activity metrics
        for (Activity a : activities) {
            List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(a.getId());
            for (MetricResult m : metrics) {
                if (m.getMetricName().equals("time_in_zones") && !m.isNumeric()) {
                    zones.put("timeInZones", m.getJsonValue());
                }
            }
        }
        return zones;
    }

    private Map<String, Object> buildReadiness() {
        Map<String, Object> readiness = new HashMap<>();
        LocalDate today = LocalDate.now();
        DateRange range = DateRange.of(today, today);

        Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", range);
        Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", range);
        Map<LocalDate, BigDecimal> tsbSeries = dailyMetricRepository.findNumericSeries("tsb", range);
        Map<LocalDate, BigDecimal> readinessSeries = dailyMetricRepository.findNumericSeries("readiness", range);
        BigDecimal currentReadiness = readinessSeries.getOrDefault(today, BigDecimal.ZERO);
        BigDecimal currentCtl = ctlSeries.getOrDefault(today, BigDecimal.ZERO);
        BigDecimal currentAtl = atlSeries.getOrDefault(today, BigDecimal.ZERO);
        BigDecimal currentTsb = tsbSeries.getOrDefault(today, BigDecimal.ZERO);

        double ctl = currentCtl.doubleValue();
        double atl = currentAtl.doubleValue();
        double tsb = currentTsb.doubleValue();
        double readinessScore = currentReadiness.doubleValue();
        double atlCtlRatio = ctl > 0 ? atl / ctl : 0.0;

        readiness.put("currentReadiness", currentReadiness);
        readiness.put("currentTSB", currentTsb);
        readiness.put("currentCTL", currentCtl);
        readiness.put("currentATL", currentAtl);
        readiness.put("atlCtlRatio", BigDecimal.valueOf(atlCtlRatio).setScale(2, RoundingMode.HALF_UP));
        readiness.put("trainingWindow", determineTrainingWindow(tsb, readinessScore, atlCtlRatio));
        readiness.put("coachingGuidance", buildCoachingGuidance(tsb, readinessScore, atlCtlRatio));
        enrichWithStructuredReadiness(readiness);
        return readiness;
    }

    private void enrichWithStructuredReadiness(Map<String, Object> readiness) {
        ReadinessDto structuredReadiness = analyticsService.getReadiness();
        if (structuredReadiness == null) {
            return;
        }
        readiness.put("dayType", structuredReadiness.getDayType());
        readiness.put("dayLabel", structuredReadiness.getDayLabel());
        readiness.put("dayFocus", structuredReadiness.getDayFocus());
        readiness.put("tomorrowHint", structuredReadiness.getTomorrowHint());
        readiness.put("bestQualityWindowLabel", structuredReadiness.getBestQualityWindowLabel());
        readiness.put("qualityWindowSummary", structuredReadiness.getQualityWindowSummary());
        readiness.put("qualityWindows", mapQualityWindows(structuredReadiness.getQualityWindows()));
        readiness.put("sessionVariants", mapSessionVariants(structuredReadiness.getSessionVariants()));
    }

    private List<Map<String, Object>> mapSessionVariants(List<ReadinessSessionVariantDto> sessionVariants) {
        if (sessionVariants == null) {
            return List.of();
        }
        return sessionVariants.stream()
                .map(variant -> {
                    Map<String, Object> mappedVariant = new LinkedHashMap<>();
                    mappedVariant.put("title", variant.getTitle());
                    mappedVariant.put("durationMinutes", variant.getDurationMinutes());
                    mappedVariant.put("targetPower", variant.getTargetPower());
                    mappedVariant.put("targetTss", variant.getTargetTss());
                    mappedVariant.put("fuelingHint", variant.getFuelingHint());
                    mappedVariant.put("recoveryHint", variant.getRecoveryHint());
                    return mappedVariant;
                })
                .toList();
    }

    private List<Map<String, Object>> mapQualityWindows(List<pl.strava.analizator.application.dto.ReadinessWindowDto> qualityWindows) {
        if (qualityWindows == null) {
            return List.of();
        }
        return qualityWindows.stream()
                .map(window -> {
                    Map<String, Object> mappedWindow = new LinkedHashMap<>();
                    mappedWindow.put("date", window.getDate());
                    mappedWindow.put("label", window.getLabel());
                    mappedWindow.put("score", window.getScore());
                    mappedWindow.put("recommendation", window.getRecommendation());
                    mappedWindow.put("focus", window.getFocus());
                    return mappedWindow;
                })
                .toList();
    }

    private String determineTrainingWindow(double tsb, double readinessScore, double atlCtlRatio) {
        if (tsb < -30 || readinessScore < 25 || atlCtlRatio >= 1.35) {
            return "recovery-priority";
        }
        if (tsb < 0) {
            return "productive-fatigue";
        }
        if (tsb <= 10) {
            return "quality-window";
        }
        return "fresh";
    }

    private String buildCoachingGuidance(double tsb, double readinessScore, double atlCtlRatio) {
        if (tsb < -30 || readinessScore < 25 || atlCtlRatio >= 1.35) {
            return "TSB below -30, readiness under 25, or ATL/CTL >= 1.35 points to recovery priority."
                    + " Keep the day easy or fully off.";
        }
        if (tsb < 0) {
            return "TSB between -30 and 0 is still a trainable window for aerobic, tempo, or controlled threshold work."
                    + " Do not default to full rest unless stronger fatigue red flags appear.";
        }
        if (tsb <= 10) {
            return "TSB between 0 and +10 is a solid quality-training window."
                    + " Threshold or race-specific work is usually appropriate.";
        }
        return "TSB above +10 usually means the athlete is fresh."
                + " This is a good window for hard intervals, testing, or racing.";
    }

    private String formatDaysAgo(OffsetDateTime startedAt) {
        if (startedAt == null) {
            return "unknown age";
        }
        long daysAgo = ChronoUnit.DAYS.between(startedAt.toLocalDate(), LocalDate.now(ZoneOffset.UTC));
        if (daysAgo <= 0) {
            return "today";
        }
        return daysAgo + "d ago";
    }

    private Map<String, Object> buildPowerCurve(List<Activity> activities) {
        Map<String, Object> curve = new HashMap<>();
        for (Activity a : activities) {
            List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(a.getId());
            for (MetricResult m : metrics) {
                if (m.getMetricName().equals("power_curve") && !m.isNumeric()) {
                    // Re-key efforts from seconds to human-readable labels so AI doesn't confuse
                    // "5": 443W (5 seconds) with "5 minutes". Labels: "5s", "1min", "20min", etc.
                    Object raw = m.getJsonValue().get("efforts");
                    if (raw instanceof Map<?, ?> rawMap) {
                        Map<String, Object> labeled = new java.util.LinkedHashMap<>();
                        Map<Integer, String> durationLabels = new HashMap<>();
                        durationLabels.put(1, "1s"); durationLabels.put(5, "5s");
                        durationLabels.put(10, "10s"); durationLabels.put(30, "30s");
                        durationLabels.put(60, "1min"); durationLabels.put(120, "2min");
                        durationLabels.put(300, "5min"); durationLabels.put(600, "10min");
                        durationLabels.put(1200, "20min"); durationLabels.put(1800, "30min");
                        durationLabels.put(3600, "60min");
                        rawMap.forEach((k, v) -> {
                            int secs = Integer.parseInt(String.valueOf(k));
                            String label = durationLabels.getOrDefault(secs, secs + "s");
                            labeled.put(label, v);
                        });
                        curve.put("bestEffortsWatts_keyIsTimeLabel", labeled);
                    }
                    return curve;
                }
            }
        }
        return curve;
    }

    private String displayMetricName(String name) {
        return switch (name) {
            case "training_stress_score", "tss" -> "tss";
            case "normalized_power", "np" -> "np";
            case "intensity_factor", "if" -> "if";
            case "efficiency_factor", "ef" -> "ef";
            default -> name;
        };
    }

    private List<String> buildPredictionHistory(PredictionType type) {
        Instant from = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS);
        List<AiPrediction> past = aiPredictionRepository.findByTypeAndCreatedAtBetween(type.name(), from, Instant.now());
        return past.stream()
                .limit(5)
                .map(p -> String.format("[%s] %s (confidence=%.2f%s)",
                        p.getCreatedAt().toString().substring(0, 10),
                        p.getSummary() != null ? p.getSummary() : "N/A",
                        p.getConfidence(),
                        p.getAccuracyScore() != null
                                ? String.format(", accuracy=%.2f", p.getAccuracyScore())
                                : ""))
                .toList();
    }
}
