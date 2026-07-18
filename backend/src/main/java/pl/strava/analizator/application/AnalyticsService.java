package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.DailyOptimalLoadDto;
import pl.strava.analizator.application.dto.DurabilityInsightDto;
import pl.strava.analizator.application.dto.DurabilityWorkoutDto;
import pl.strava.analizator.application.dto.FtpProgressDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.PeriodComparisonDto;
import pl.strava.analizator.application.dto.PeriodSummaryDto;
import pl.strava.analizator.application.dto.PowerCurveDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.RaceReadinessProjection;
import pl.strava.analizator.application.dto.ReadinessCheckInDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.ReadinessHealthSignalsDto;
import pl.strava.analizator.application.dto.ReadinessSessionVariantDto;
import pl.strava.analizator.application.dto.ReadinessWindowDto;
import pl.strava.analizator.application.dto.SaveReadinessCheckInRequest;
import pl.strava.analizator.application.dto.TrainingPhaseAnalysis;
import pl.strava.analizator.application.dto.TrendDto;
import pl.strava.analizator.application.dto.WeeklyMmpDto;
import pl.strava.analizator.application.dto.WeeklyOptimalLoadDto;
import pl.strava.analizator.application.dto.WeeklySummaryDto;
import pl.strava.analizator.application.dto.ZoneDistributionDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final String POWER_CURVE_METRIC = "power_curve";
    private static final String TIME_IN_ZONES_METRIC = "time_in_zones";
    private static final String TSS_METRIC = "training_stress_score";
    private static final String W_PRIME_BALANCE_METRIC = "w_prime_balance";

    private static final Map<Integer, String> DURATION_LABELS = Map.ofEntries(
            Map.entry(1, "1s"), Map.entry(5, "5s"), Map.entry(10, "10s"),
            Map.entry(30, "30s"), Map.entry(60, "1min"), Map.entry(120, "2min"),
            Map.entry(300, "5min"), Map.entry(600, "10min"), Map.entry(1200, "20min"),
            Map.entry(1800, "30min"), Map.entry(3600, "60min"), Map.entry(5400, "90min"),
            Map.entry(7200, "120min")
    );

    private static final double ACWR_OPTIMAL_MIN = 0.8;
    private static final double ACWR_OPTIMAL_MAX = 1.3;
    private static final double ACWR_DANGER = 1.5;
    private static final double ACWR_INSUFFICIENT = 0.5;
    private static final int DAYS_PER_WEEK = 7;
    private static final int TRAINING_PATTERN_LOOKBACK_DAYS = 28;

    private final DailyMetricRepository dailyMetricRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final DailySummaryRepository dailySummaryRepository;

    /**
     * PMC chart: CTL/ATL/TSB time series with day-over-day deltas.
     */
    public List<PmcDataDto> getPmc(LocalDate from, LocalDate to) {
        // Fetch one extra day before 'from' to compute delta for the first requested day
        LocalDate extendedFrom = from.minusDays(1);
        DateRange range = DateRange.of(extendedFrom, to);
        Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", range);
        Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", range);
        Map<LocalDate, BigDecimal> tsbSeries = dailyMetricRepository.findNumericSeries("tsb", range);

        BigDecimal prevCtl = ctlSeries.getOrDefault(extendedFrom, BigDecimal.ZERO);
        BigDecimal prevAtl = atlSeries.getOrDefault(extendedFrom, BigDecimal.ZERO);
        BigDecimal prevTsb = tsbSeries.getOrDefault(extendedFrom, BigDecimal.ZERO);

        List<PmcDataDto> result = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            BigDecimal ctl = ctlSeries.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal atl = atlSeries.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal tsb = tsbSeries.getOrDefault(date, BigDecimal.ZERO);
            result.add(PmcDataDto.builder()
                    .date(date)
                    .ctl(ctl)
                    .atl(atl)
                    .tsb(tsb)
                    .ctlDelta(ctl.subtract(prevCtl))
                    .atlDelta(atl.subtract(prevAtl))
                    .tsbDelta(tsb.subtract(prevTsb))
                    .build());
            prevCtl = ctl;
            prevAtl = atl;
            prevTsb = tsb;
        }
        return result;
    }

    /**
     * Aggregate power curve: best efforts across all activities in the date range.
     */
    public PowerCurveDto getPowerCurve(LocalDate from, LocalDate to) {
        List<Activity> activities = findActivitiesBetween(from, to);

        Map<Integer, Double> bestEfforts = new TreeMap<>();

        for (Activity a : activities) {
            List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(a.getId());
            for (MetricResult m : metrics) {
                if (POWER_CURVE_METRIC.equals(m.getMetricName()) && m.getJsonValue() != null) {
                    Map<String, Object> curveJson = m.getJsonValue();
                    Object effortsObj = curveJson.get("efforts");
                    if (effortsObj instanceof Map<?, ?> effortsMap) {
                        for (Map.Entry<?, ?> e : effortsMap.entrySet()) {
                            int duration = Integer.parseInt(String.valueOf(e.getKey()));
                            double watts = Double.parseDouble(String.valueOf(e.getValue()));
                            bestEfforts.merge(duration, watts, (current, candidate) -> Double.max(current, candidate));
                        }
                    }
                }
            }
        }

        return PowerCurveDto.builder().efforts(bestEfforts).build();
    }

    /**
     * Zone distribution: aggregate time in zones across activities within a date range.
     */
    public ZoneDistributionDto getZoneDistribution(String zoneType, LocalDate from, LocalDate to) {
        List<Activity> activities = findActivitiesBetween(from, to);

        Map<String, Integer> totalZoneSeconds = new LinkedHashMap<>();

        for (Activity a : activities) {
            List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(a.getId());
            for (MetricResult m : metrics) {
                if (TIME_IN_ZONES_METRIC.equals(m.getMetricName()) && m.getJsonValue() != null) {
                    String key = "power".equals(zoneType) ? "powerZoneSeconds" : "hrZoneSeconds";
                    Object zonesObj = m.getJsonValue().get(key);
                    if (zonesObj instanceof Map<?, ?> zonesMap) {
                        for (Map.Entry<?, ?> e : zonesMap.entrySet()) {
                            String zone = String.valueOf(e.getKey());
                            int secs = Integer.parseInt(String.valueOf(e.getValue()));
                            totalZoneSeconds.merge(zone, secs, (current, candidate) -> Integer.sum(current, candidate));
                        }
                    }
                }
            }
        }

        int total = totalZoneSeconds.values().stream().mapToInt(Integer::intValue).sum();
        Map<String, Double> zoneSeconds = new LinkedHashMap<>();
        totalZoneSeconds.forEach((zone, secs) -> zoneSeconds.put(zone, secs.doubleValue()));

        return ZoneDistributionDto.builder()
                .zoneType(zoneType)
                .zones(zoneSeconds)
                .totalSeconds(total)
                .build();
    }

    /**
     * Weekly summaries for the last N weeks.
     */
    public List<WeeklySummaryDto> getWeeklySummaries(int weeks) {
        LocalDate now = LocalDate.now();
        LocalDate start = now.minusWeeks(weeks).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<Activity> activities = activityRepository.findByStartedAtBetween(
                startOfDay(start),
                startOfNextDay(now));

        // Group by ISO week start (Monday)
        Map<LocalDate, List<Activity>> weekGroups = new LinkedHashMap<>();
        for (Activity a : activities) {
            if (a.getStartedAt() != null) {
                LocalDate weekStart = a.getStartedAt().toLocalDate()
                        .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                weekGroups.computeIfAbsent(weekStart, k -> new ArrayList<>()).add(a);
            }
        }

        List<WeeklySummaryDto> result = new ArrayList<>();
        for (LocalDate weekStart = start; !weekStart.isAfter(now); weekStart = weekStart.plusWeeks(1)) {
            List<Activity> weekActivities = weekGroups.getOrDefault(weekStart, List.of());

            BigDecimal totalDist = BigDecimal.ZERO;
            int totalTime = 0;
            BigDecimal totalElev = BigDecimal.ZERO;
            BigDecimal totalTss = BigDecimal.ZERO;

            for (Activity a : weekActivities) {
                if (a.getDistanceM() != null) totalDist = totalDist.add(a.getDistanceM());
                if (a.getMovingTimeSec() != null) totalTime += a.getMovingTimeSec();
                if (a.getElevationGainM() != null) totalElev = totalElev.add(a.getElevationGainM());

                var tssOpt = activityMetricRepository.findNumericValue(a.getId(), TSS_METRIC);
                if (tssOpt.isPresent()) {
                    totalTss = totalTss.add(tssOpt.get());
                }
            }

            // Fall back to daily_tss from daily metrics when no activity-level TSS found
            if (totalTss.compareTo(BigDecimal.ZERO) == 0 && !weekActivities.isEmpty()) {
                LocalDate weekEnd = weekStart.plusDays(6);
                DateRange weekRange = DateRange.of(weekStart, weekEnd.isAfter(now) ? now : weekEnd);
                Map<LocalDate, BigDecimal> dailyTss = dailyMetricRepository.findNumericSeries("daily_tss", weekRange);
                for (BigDecimal val : dailyTss.values()) {
                    totalTss = totalTss.add(val);
                }
            }

            result.add(WeeklySummaryDto.builder()
                    .weekStart(weekStart)
                    .activityCount(weekActivities.size())
                    .totalDistanceM(totalDist)
                    .totalTimeSec(totalTime)
                    .totalElevationM(totalElev)
                    .totalTss(totalTss)
                    .build());
        }
        return result;
    }

    /**
     * Aggregate summary for a period (last week/month/year).
     */
    public Map<String, Object> getSummary(String period) {
        LocalDate now = LocalDate.now();
        LocalDate from = switch (period) {
            case "week" -> now.minusWeeks(1);
            case "month" -> now.minusMonths(1);
            case "year" -> now.minusYears(1);
            default -> now.minusMonths(1);
        };

        List<Activity> activities = activityRepository.findByStartedAtBetween(
                startOfDay(from),
                startOfNextDay(now));

        BigDecimal totalDist = BigDecimal.ZERO;
        int totalTime = 0;
        BigDecimal totalElev = BigDecimal.ZERO;
        int count = activities.size();

        for (Activity a : activities) {
            if (a.getDistanceM() != null) totalDist = totalDist.add(a.getDistanceM());
            if (a.getMovingTimeSec() != null) totalTime += a.getMovingTimeSec();
            if (a.getElevationGainM() != null) totalElev = totalElev.add(a.getElevationGainM());
        }

        return Map.of(
                "period", period,
                "from", from.toString(),
                "to", now.toString(),
                "activityCount", count,
                "totalDistanceM", totalDist,
                "totalTimeSec", totalTime,
                "totalElevationM", totalElev
        );
    }

    /**
     * Metric trends over time.
     */
    public List<TrendDto> getTrends(String metricName, LocalDate from, LocalDate to) {
        DateRange range = DateRange.of(from, to);
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(metricName, range);

        return series.entrySet().stream()
                .map(e -> TrendDto.builder()
                        .date(e.getKey())
                        .metricName(metricName)
                        .value(e.getValue())
                        .build())
                .toList();
    }

    /**
     * Compare two periods.
     */
    public Map<String, Object> comparePeriods(LocalDate p1From, LocalDate p1To, LocalDate p2From, LocalDate p2To) {
        Map<String, Object> period1 = getSummaryForRange(p1From, p1To);
        Map<String, Object> period2 = getSummaryForRange(p2From, p2To);
        return Map.of("period1", period1, "period2", period2);
    }

    public PeriodComparisonDto comparePeriodsTyped(
            LocalDate p1From, LocalDate p1To, LocalDate p2From, LocalDate p2To) {
        PeriodSummaryDto period1 = getTypedSummaryForRange(p1From, p1To);
        PeriodSummaryDto period2 = getTypedSummaryForRange(p2From, p2To);
        String availability = period1.getActivityCount() == 0 && period2.getActivityCount() == 0
                ? "UNKNOWN" : "AVAILABLE";
        return PeriodComparisonDto.builder()
                .period1(period1)
                .period2(period2)
                .availability(availability)
                .build();
    }

    private PeriodSummaryDto getTypedSummaryForRange(LocalDate from, LocalDate to) {
        List<Activity> activities = findActivitiesBetween(from, to);
        BigDecimal totalDist = BigDecimal.ZERO;
        int totalTime = 0;
        BigDecimal totalElev = BigDecimal.ZERO;
        for (Activity activity : activities) {
            if (activity.getDistanceM() != null) totalDist = totalDist.add(activity.getDistanceM());
            if (activity.getMovingTimeSec() != null) totalTime += activity.getMovingTimeSec();
            if (activity.getElevationGainM() != null) totalElev = totalElev.add(activity.getElevationGainM());
        }
        return PeriodSummaryDto.builder()
                .from(from)
                .to(to)
                .activityCount(activities.size())
                .totalDistanceM(totalDist)
                .totalTimeSec(totalTime)
                .totalElevationM(totalElev)
                .build();
    }

    private Map<String, Object> getSummaryForRange(LocalDate from, LocalDate to) {
        List<Activity> activities = findActivitiesBetween(from, to);

        BigDecimal totalDist = BigDecimal.ZERO;
        int totalTime = 0;
        BigDecimal totalElev = BigDecimal.ZERO;

        for (Activity a : activities) {
            if (a.getDistanceM() != null) totalDist = totalDist.add(a.getDistanceM());
            if (a.getMovingTimeSec() != null) totalTime += a.getMovingTimeSec();
            if (a.getElevationGainM() != null) totalElev = totalElev.add(a.getElevationGainM());
        }

        return Map.of(
                "from", from.toString(),
                "to", to.toString(),
                "activityCount", activities.size(),
                "totalDistanceM", totalDist,
                "totalTimeSec", totalTime,
                "totalElevationM", totalElev
        );
    }

    /**
     * FTP progress: current FTP from profile, trend from daily metric history.
     * If {@code from}/{@code to} are null the default is last 90 days.
     */
    public FtpProgressDto getFtpProgress(LocalDate from, LocalDate to) {
        AthleteProfile profile = athleteProfileRepository.findFirst()
                .orElse(null);

        Short profileFtp = profile != null ? profile.getFtpWatts() : null;

        LocalDate rangeEnd   = to   != null ? to   : LocalDate.now();
        LocalDate rangeStart = from != null ? from : rangeEnd.minusDays(90);
        DateRange range = DateRange.of(rangeStart, rangeEnd);
        Map<LocalDate, BigDecimal> ftpSeries = dailyMetricRepository.findNumericSeries("ftp", range);

        List<FtpProgressDto.FtpPoint> history = ftpSeries.entrySet().stream()
                .map(e -> FtpProgressDto.FtpPoint.builder()
                        .date(e.getKey().toString())
                        .value(e.getValue())
                        .build())
                .toList();

        // Use profile FTP if set, otherwise use latest estimated FTP from daily metrics
        Short currentFtp = profileFtp;
        if (currentFtp == null && !history.isEmpty()) {
            currentFtp = history.get(history.size() - 1).getValue().shortValue();
        }

        String trend = "stagnant";
        double changePercent = 0;

        if (history.size() >= 2) {
            BigDecimal oldest = history.get(0).getValue();
            BigDecimal newest = history.get(history.size() - 1).getValue();
            if (oldest.compareTo(BigDecimal.ZERO) > 0) {
                changePercent = newest.subtract(oldest)
                        .divide(oldest, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }
            if (changePercent > 1.0) trend = "up";
            else if (changePercent < -1.0) trend = "down";
        }

        return FtpProgressDto.builder()
                .currentFtp(currentFtp)
                .trend(trend)
                .changePercent(changePercent)
                .history(history)
                .build();
    }

    /**
     * Training readiness score based on PMC data (TSB, CTL, ATL).
     * Score 0-100: positive TSB = more rested, high CTL = good fitness base.
     */
    public ReadinessDto getReadiness() {
        LocalDate today = LocalDate.now();
        BigDecimal tsbVal = dailyMetricRepository.findNumericValue(today, "tsb")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "tsb"))
                .orElse(BigDecimal.ZERO);
        BigDecimal ctlVal = dailyMetricRepository.findNumericValue(today, "ctl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "ctl"))
                .orElse(BigDecimal.ZERO);
        BigDecimal atlVal = dailyMetricRepository.findNumericValue(today, "atl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "atl"))
                .orElse(BigDecimal.ZERO);
        DailySummary todaySummary = dailySummaryRepository.findByDate(today).orElse(null);
        DailySummary healthSummary = todaySummary != null
                ? todaySummary
                : dailySummaryRepository.findByDate(today.minusDays(1)).orElse(null);
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);

        double tsb = tsbVal.doubleValue();
        double ctl = ctlVal.doubleValue();
        double atl = atlVal.doubleValue();

        // Readiness calculation:
        // TSB contribution: TSB range typically -30 to +30, map to 0-60 points
        // Positive TSB = rested, negative = fatigued
        double tsbScore = Math.max(0, Math.min(60, (tsb + 30) * 2));

        // Fitness base bonus: higher CTL = better prepared (up to 25 points)
        double fitnessBonus = Math.min(25, ctl * 0.5);

        // Fatigue penalty: if ATL is much higher than CTL, penalty (up to -15)
        double fatiguePenalty = 0;
        if (ctl > 0 && atl > ctl * 1.3) {
            fatiguePenalty = Math.min(15, (atl - ctl) * 0.5);
        }

        int baseScore = (int) Math.round(Math.max(0, Math.min(100, tsbScore + fitnessBonus - fatiguePenalty)));
        ReadinessHealthSignalsDto healthSignals = buildHealthSignals(healthSummary, profile);
        ReadinessCheckInDto checkIn = buildCheckIn(todaySummary);
        int score = clampReadinessScore(baseScore
                + (healthSignals != null ? healthSignals.getScoreAdjustment() : 0)
                + (checkIn != null ? checkIn.getScoreAdjustment() : 0));
        DayTypeDecision dayType = classifyDayType(score, tsb, ctl, atl);
        List<ReadinessWindowDto> qualityWindows = buildQualityWindows(score, tsb, ctl, atl);
        ReadinessWindowDto bestQualityWindow = selectBestQualityWindow(qualityWindows);

        String level;
        String description;
        if (score >= 95) {
            level = "pełna moc";
            description = "Szczytowa forma, idealny dzień na zawody lub test FTP";
        } else if (score >= 75) {
            level = "energia";
            description = "Organizm wypoczęty, dobry dzień na intensywny trening";
        } else if (score >= 55) {
            level = "dobra";
            description = "Dobra gotowość, można trenować z solidnym obciążeniem";
        } else if (score >= 35) {
            level = "zmęczenie";
            description = "Umiarkowana gotowość, lżejszy trening lub aktywny odpoczynek";
        } else if (score >= 15) {
            level = "trudność";
            description = "Organizm zmęczony, zalecany odpoczynek lub lekki trening";
        } else {
            level = "wyczerpanie";
            description = "Pełne wyczerpanie, odpoczynek jest priorytetem";
        }

        return ReadinessDto.builder()
                .score(score)
                .level(level)
                .tsb(tsb)
                .ctl(ctl)
                .atl(atl)
                .description(description)
                .dayType(dayType.type())
                .dayLabel(dayType.label())
                .dayFocus(dayType.focus())
                .sessionVariants(buildSessionVariants(dayType.type()))
                .tomorrowHint(buildTomorrowHint(dayType.type()))
                .bestQualityWindowLabel(bestQualityWindow != null ? bestQualityWindow.getLabel() : null)
                .qualityWindowSummary(buildQualityWindowSummary(bestQualityWindow))
                .qualityWindows(qualityWindows)
                .healthSignals(healthSignals)
                .checkIn(checkIn)
                .build();
    }

    public ReadinessDto saveReadinessCheckIn(SaveReadinessCheckInRequest request) {
        LocalDate today = LocalDate.now();
        Instant now = Instant.now();
        DailySummary summary = dailySummaryRepository.findByDate(today)
                .orElse(DailySummary.builder()
                        .date(today)
                        .createdAt(now)
                        .updatedAt(now)
                        .build());

        DailySummary updated = summary.toBuilder()
                .checkInSleepQuality(request.getSleepQuality())
                .checkInLegFreshness(request.getLegFreshness())
                .checkInMotivation(request.getMotivation())
                .checkInSoreness(request.getSoreness())
                .checkInUpdatedAt(now)
                .createdAt(summary.getCreatedAt() != null ? summary.getCreatedAt() : now)
                .updatedAt(now)
                .build();

        dailySummaryRepository.save(updated);
        return getReadiness();
    }

    public DurabilityInsightDto getDurabilityInsights() {
        OffsetDateTime from = OffsetDateTime.now(ZoneOffset.UTC).minusDays(90);
        OffsetDateTime to = OffsetDateTime.now(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to).stream()
                .filter(activity -> activity.getStartedAt() != null)
                .filter(activity -> activity.getMovingTimeSec() != null && activity.getMovingTimeSec() >= 45 * 60)
                .sorted(Comparator.comparing(Activity::getStartedAt).reversed())
                .limit(6)
                .toList();

        if (activities.isEmpty()) {
            return DurabilityInsightDto.builder()
                    .trend("NO_DATA")
                    .label("Brak danych")
                    .description("Potrzeba kilku dłuższych jazd z mocą i tętnem, żeby ocenić odporność na zmęczenie.")
                    .avgAerobicDecoupling(BigDecimal.ZERO)
                    .avgPowerFade(BigDecimal.ZERO)
                    .avgDurabilityScore(0)
                    .workouts(List.of())
                    .build();
        }

        List<UUID> activityIds = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tssByActivity = activityMetricRepository.findNumericValues(activityIds, "tss");
        Map<UUID, BigDecimal> decouplingByActivity = activityMetricRepository.findNumericValues(activityIds, "aerobic_decoupling");
        Map<UUID, BigDecimal> powerFadeByActivity = activityMetricRepository.findNumericValues(activityIds, "power_fade");

        List<DurabilityWorkoutDto> workouts = activities.stream()
                .map(activity -> toDurabilityWorkout(activity, tssByActivity, decouplingByActivity, powerFadeByActivity))
                .toList();

        BigDecimal avgDecoupling = average(workouts.stream()
                .map(DurabilityWorkoutDto::getAerobicDecoupling)
                .filter(value -> value != null)
                .toList());
        BigDecimal avgPowerFade = average(workouts.stream()
                .map(DurabilityWorkoutDto::getPowerFade)
                .filter(value -> value != null)
                .toList());
        int avgDurabilityScore = (int) Math.round(workouts.stream()
                .map(DurabilityWorkoutDto::getDurabilityScore)
                .filter(score -> score != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));

        String trend = classifyDurabilityTrend(avgDurabilityScore, avgDecoupling, avgPowerFade);
        return DurabilityInsightDto.builder()
                .trend(trend)
                .label(durabilityLabel(trend))
                .description(durabilityDescription(trend, avgDecoupling, avgPowerFade))
                .avgAerobicDecoupling(avgDecoupling)
                .avgPowerFade(avgPowerFade)
                .avgDurabilityScore(avgDurabilityScore)
                .workouts(workouts)
                .build();
    }

    private List<ReadinessWindowDto> buildQualityWindows(int score, double tsb, double ctl, double atl) {
        return List.of(
                buildQualityWindow("Dziś", LocalDate.now(), score, tsb, ctl, atl),
                buildQualityWindow("Jutro", LocalDate.now().plusDays(1), forecastScore(score, tsb, 1), forecastTsb(tsb, score, 1), ctl, atl),
                buildQualityWindow("Pojutrze", LocalDate.now().plusDays(2), forecastScore(score, tsb, 2), forecastTsb(tsb, score, 2), ctl, atl));
    }

    private ReadinessWindowDto buildQualityWindow(String label, LocalDate date, int score, double tsb, double ctl, double atl) {
        DayTypeDecision decision = classifyDayType(score, tsb, ctl, atl);
        return ReadinessWindowDto.builder()
                .date(date)
                .label(label)
                .score(score)
                .recommendation(classifyQualityRecommendation(score, decision.type()))
                .focus(decision.focus())
                .build();
    }

    private int forecastScore(int score, double tsb, int dayOffset) {
        if (score >= 75) {
            return clampReadinessScore(score - (dayOffset == 1 ? 6 : 10));
        }
        if (tsb <= -15) {
            return clampReadinessScore(score + (dayOffset == 1 ? 12 : 18));
        }
        if (tsb < 0) {
            return clampReadinessScore(score + (dayOffset == 1 ? 8 : 12));
        }
        return clampReadinessScore(score + (dayOffset == 1 ? 2 : 0));
    }

    private double forecastTsb(double tsb, int score, int dayOffset) {
        if (score >= 75) {
            return tsb - (dayOffset == 1 ? 5 : 8);
        }
        if (tsb <= -15) {
            return tsb + (dayOffset == 1 ? 8 : 14);
        }
        if (tsb < 0) {
            return tsb + (dayOffset == 1 ? 6 : 10);
        }
        return tsb;
    }

    private String classifyQualityRecommendation(int score, String dayType) {
        if (score >= 70 && ("HIGH_INTENSITY".equals(dayType) || "TEMPO".equals(dayType))) {
            return "BEST_QUALITY";
        }
        if (score >= 55 && "TEMPO".equals(dayType)) {
            return "BEST_QUALITY";
        }
        if (score >= 45) {
            return "CONTROLLED";
        }
        return "PROTECT";
    }

    private String buildQualityWindowSummary(ReadinessWindowDto bestQualityWindow) {
        if (bestQualityWindow == null) {
            return "Brak czytelnego okna jakości na najbliższe 72h.";
        }
        return "Najlepsze okno jakości wypada %s, jeśli utrzymasz kontrolę obciążenia.".formatted(
                bestQualityWindow.getLabel().toLowerCase());
    }

    private ReadinessWindowDto selectBestQualityWindow(List<ReadinessWindowDto> qualityWindows) {
        return qualityWindows.stream()
                .filter(window -> "BEST_QUALITY".equals(window.getRecommendation()))
                .findFirst()
                .orElseGet(() -> qualityWindows.stream()
                        .filter(window -> window.getScore() >= 55)
                        .findFirst()
                        .orElseGet(() -> qualityWindows.stream()
                                .max(Comparator.comparingInt(ReadinessWindowDto::getScore))
                                .orElse(null)));
    }

    public List<ProgressionLevelDto> getProgressionLevels() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime from = today.minusDays(42).atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime to = today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to).stream()
                .filter(activity -> activity.getStartedAt() != null)
                .filter(activity -> activity.getMovingTimeSec() != null && activity.getMovingTimeSec() >= 30 * 60)
                .toList();

        if (activities.isEmpty()) {
            return List.of(
                    emptyProgression("THRESHOLD", "Próg", BigDecimal.valueOf(70)),
                    emptyProgression("VO2", "VO2", BigDecimal.valueOf(28)),
                    emptyProgression("LONG_ENDURANCE", "Długi tlen", BigDecimal.valueOf(180))
            );
        }

        List<UUID> activityIds = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> intensityFactors = activityMetricRepository.findNumericValues(activityIds, "intensity_factor");
        Map<UUID, BigDecimal> decouplingValues = activityMetricRepository.findNumericValues(activityIds, "aerobic_decoupling");
        LocalDate currentBlockStart = today.minusDays(20);
        LocalDate previousBlockStart = today.minusDays(41);
        LocalDate previousBlockEnd = today.minusDays(21);

        return List.of(
                buildProgressionLevel(
                        "THRESHOLD",
                        "Próg",
                        BigDecimal.valueOf(70),
                        sumSystemLoad(activities, intensityFactors, decouplingValues, currentBlockStart, today, "THRESHOLD"),
                        sumSystemLoad(activities, intensityFactors, decouplingValues, previousBlockStart, previousBlockEnd, "THRESHOLD")),
                buildProgressionLevel(
                        "VO2",
                        "VO2",
                        BigDecimal.valueOf(28),
                        sumSystemLoad(activities, intensityFactors, decouplingValues, currentBlockStart, today, "VO2"),
                        sumSystemLoad(activities, intensityFactors, decouplingValues, previousBlockStart, previousBlockEnd, "VO2")),
                buildProgressionLevel(
                        "LONG_ENDURANCE",
                        "Długi tlen",
                        BigDecimal.valueOf(180),
                        sumSystemLoad(activities, intensityFactors, decouplingValues, currentBlockStart, today, "LONG_ENDURANCE"),
                        sumSystemLoad(activities, intensityFactors, decouplingValues, previousBlockStart, previousBlockEnd, "LONG_ENDURANCE"))
        );
    }

    private DayTypeDecision classifyDayType(int score, double tsb, double ctl, double atl) {
        double atlCtlRatio = ctl > 0 ? atl / ctl : 0;
        if (score < 20 || tsb < -30 || atlCtlRatio >= 1.45) {
            return new DayTypeDecision(
                    "OFF",
                    "Wolne",
                    "Priorytetem jest odpoczynek albo bardzo lekka mobilność.");
        }
        if (score < 35 || tsb < -20 || atlCtlRatio >= 1.35) {
            return new DayTypeDecision(
                    "RECOVERY",
                    "Regeneracja",
                    "Najlepszy będzie bardzo lekki trening regeneracyjny albo krótka spokojna jazda.");
        }
        if (score < 55 || tsb < -5) {
            return new DayTypeDecision(
                    "ENDURANCE",
                    "Tlen",
                    "Najlepszy będzie spokojny trening tlenowy z kontrolą obciążenia.");
        }
        if (score < 70 || tsb < 5) {
            return new DayTypeDecision(
                    "TEMPO",
                    "Tempo",
                    "Dzień pasuje do stabilnego tempa bez wchodzenia w pełną jakość.");
        }
        if (score < 85 || tsb < 12) {
            return new DayTypeDecision(
                    "THRESHOLD",
                    "Próg",
                    "To dobre okno na solidny bodziec progowy lub sweet spot.");
        }
        return new DayTypeDecision(
                "HIGH_INTENSITY",
                "Mocny bodziec",
                "Jesteś świeży — to dobry moment na interwały, mocny akcent albo test.");
    }

    private record DayTypeDecision(String type, String label, String focus) {
    }

    private ReadinessHealthSignalsDto buildHealthSignals(DailySummary summary, AthleteProfile profile) {
        if (summary == null) {
            return null;
        }
        int adjustment = 0;
        if (summary.getSleepScore() != null) {
            if (summary.getSleepScore() >= 85) {
                adjustment += 4;
            } else if (summary.getSleepScore() < 60) {
                adjustment -= 8;
            } else if (summary.getSleepScore() < 70) {
                adjustment -= 4;
            }
        }
        if (summary.getBodyBattery() != null) {
            if (summary.getBodyBattery() >= 70) {
                adjustment += 5;
            } else if (summary.getBodyBattery() < 35) {
                adjustment -= 8;
            } else if (summary.getBodyBattery() < 50) {
                adjustment -= 4;
            }
        }

        BigDecimal restingHrDelta = BigDecimal.ZERO;
        if (summary.getRestingHrBpm() != null && profile != null && profile.getRestingHrBpm() != null) {
            restingHrDelta = BigDecimal.valueOf(summary.getRestingHrBpm() - profile.getRestingHrBpm());
            if (restingHrDelta.compareTo(BigDecimal.valueOf(5)) >= 0) {
                adjustment -= 6;
            } else if (restingHrDelta.compareTo(BigDecimal.valueOf(3)) >= 0) {
                adjustment -= 3;
            } else if (restingHrDelta.compareTo(BigDecimal.valueOf(-3)) <= 0) {
                adjustment += 2;
            }
        }

        if (summary.getSleepScore() == null && summary.getBodyBattery() == null && summary.getRestingHrBpm() == null) {
            return null;
        }

        return ReadinessHealthSignalsDto.builder()
                .sourceDate(summary.getDate())
                .sleepScore(summary.getSleepScore())
                .bodyBattery(summary.getBodyBattery())
                .restingHrBpm(summary.getRestingHrBpm())
                .restingHrDelta(restingHrDelta.compareTo(BigDecimal.ZERO) == 0 ? null : restingHrDelta)
                .scoreAdjustment(adjustment)
                .build();
    }

    private ReadinessCheckInDto buildCheckIn(DailySummary summary) {
        if (summary == null
                || summary.getCheckInSleepQuality() == null
                || summary.getCheckInLegFreshness() == null
                || summary.getCheckInMotivation() == null
                || summary.getCheckInSoreness() == null) {
            return null;
        }
        return ReadinessCheckInDto.builder()
                .date(summary.getDate())
                .sleepQuality(summary.getCheckInSleepQuality())
                .legFreshness(summary.getCheckInLegFreshness())
                .motivation(summary.getCheckInMotivation())
                .soreness(summary.getCheckInSoreness())
                .scoreAdjustment(calculateCheckInAdjustment(summary))
                .updatedAt(summary.getCheckInUpdatedAt())
                .build();
    }

    private int calculateCheckInAdjustment(DailySummary summary) {
        return ((summary.getCheckInSleepQuality() - 3) * 2)
                + ((summary.getCheckInLegFreshness() - 3) * 3)
                + ((summary.getCheckInMotivation() - 3) * 2)
                + ((3 - summary.getCheckInSoreness()) * 3);
    }

    private int clampReadinessScore(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private DurabilityWorkoutDto toDurabilityWorkout(
            Activity activity,
            Map<UUID, BigDecimal> tssByActivity,
            Map<UUID, BigDecimal> decouplingByActivity,
            Map<UUID, BigDecimal> powerFadeByActivity) {
        BigDecimal decoupling = decouplingByActivity.get(activity.getId());
        BigDecimal powerFade = powerFadeByActivity.get(activity.getId());
        return DurabilityWorkoutDto.builder()
                .activityId(activity.getId())
                .date(activity.getStartedAt().toLocalDate())
                .name(activity.getName())
                .durationMin(activity.getMovingTimeSec() / 60)
                .tss(tssByActivity.get(activity.getId()))
                .aerobicDecoupling(decoupling)
                .powerFade(powerFade)
                .durabilityScore(calculateDurabilityScore(decoupling, powerFade))
                .build();
    }

    private int calculateDurabilityScore(BigDecimal decoupling, BigDecimal powerFade) {
        double penalty = Math.max(0.0, decoupling != null ? decoupling.doubleValue() : 0.0) * 4.0
                + Math.max(0.0, powerFade != null ? powerFade.doubleValue() : 0.0) * 3.0;
        return clampReadinessScore((int) Math.round(100 - penalty));
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private ProgressionLevelDto emptyProgression(String system, String label, BigDecimal targetLoad) {
        return ProgressionLevelDto.builder()
                .system(system)
                .label(label)
                .level(0)
                .currentLoad(BigDecimal.ZERO)
                .previousLoad(BigDecimal.ZERO)
                .targetLoad(targetLoad)
                .trend("NO_DATA")
                .description("Brakuje spójnych danych, żeby ocenić progres tego systemu.")
                .nextRecommendation("Zbierz jeszcze 2-3 trafione jednostki, zanim ocenimy trend.")
                .build();
    }

    private ProgressionLevelDto buildProgressionLevel(
            String system,
            String label,
            BigDecimal targetLoad,
            BigDecimal currentLoad,
            BigDecimal previousLoad) {
        String trend = progressionTrend(currentLoad, previousLoad);
        return ProgressionLevelDto.builder()
                .system(system)
                .label(label)
                .level(calculateProgressionLevel(system, currentLoad))
                .currentLoad(currentLoad)
                .previousLoad(previousLoad)
                .targetLoad(targetLoad)
                .trend(trend)
                .description(progressionDescription(system, trend, currentLoad, targetLoad))
                .nextRecommendation(progressionRecommendation(system, currentLoad, targetLoad, trend))
                .build();
    }

    private BigDecimal sumSystemLoad(
            List<Activity> activities,
            Map<UUID, BigDecimal> intensityFactors,
            Map<UUID, BigDecimal> decouplingValues,
            LocalDate from,
            LocalDate to,
            String system) {
        return activities.stream()
                .filter(activity -> {
                    LocalDate date = activity.getStartedAt().toLocalDate();
                    return !date.isBefore(from) && !date.isAfter(to);
                })
                .map(activity -> progressionLoadFor(activity, intensityFactors.get(activity.getId()), decouplingValues.get(activity.getId()), system))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(1, RoundingMode.HALF_UP);
    }

    private BigDecimal progressionLoadFor(Activity activity, BigDecimal intensityFactor, BigDecimal decoupling, String system) {
        if (activity.getMovingTimeSec() == null) {
            return BigDecimal.ZERO;
        }

        int durationMin = activity.getMovingTimeSec() / 60;
        double intensity = intensityFactor != null ? intensityFactor.doubleValue() : 0.0;
        return switch (system) {
            case "THRESHOLD" -> isThresholdSession(durationMin, intensity)
                    ? BigDecimal.valueOf(durationMin * Math.max(0.8, Math.min(1.2, intensity / 0.95)))
                    : BigDecimal.ZERO;
            case "VO2" -> isVo2Session(durationMin, intensity)
                    ? BigDecimal.valueOf(durationMin * Math.max(0.3, (intensity - 1.0) * 4.5))
                    : BigDecimal.ZERO;
            case "LONG_ENDURANCE" -> isLongEnduranceSession(durationMin, intensity)
                    ? BigDecimal.valueOf(durationMin * longEnduranceQualityFactor(decoupling))
                    : BigDecimal.ZERO;
            default -> BigDecimal.ZERO;
        };
    }

    private boolean isThresholdSession(int durationMin, double intensityFactor) {
        return durationMin >= 35 && durationMin <= 120 && intensityFactor >= 0.90 && intensityFactor <= 1.03;
    }

    private boolean isVo2Session(int durationMin, double intensityFactor) {
        return durationMin >= 30 && durationMin <= 90 && intensityFactor >= 1.03;
    }

    private boolean isLongEnduranceSession(int durationMin, double intensityFactor) {
        return durationMin >= 120 && intensityFactor >= 0.55 && intensityFactor <= 0.80;
    }

    private double longEnduranceQualityFactor(BigDecimal decoupling) {
        if (decoupling == null) {
            return 1.0;
        }
        double value = decoupling.doubleValue();
        if (value <= 5.0) {
            return 1.05;
        }
        if (value >= 8.0) {
            return 0.90;
        }
        return 1.0;
    }

    private String progressionTrend(BigDecimal currentLoad, BigDecimal previousLoad) {
        if (currentLoad.compareTo(BigDecimal.ZERO) == 0 && previousLoad.compareTo(BigDecimal.ZERO) == 0) {
            return "NO_DATA";
        }
        if (previousLoad.compareTo(BigDecimal.ZERO) == 0) {
            return "UP";
        }
        BigDecimal ratio = currentLoad.subtract(previousLoad)
                .divide(previousLoad, 4, RoundingMode.HALF_UP);
        if (ratio.compareTo(BigDecimal.valueOf(0.10)) >= 0) {
            return "UP";
        }
        if (ratio.compareTo(BigDecimal.valueOf(-0.10)) <= 0) {
            return "DOWN";
        }
        return "STABLE";
    }

    private int calculateProgressionLevel(String system, BigDecimal currentLoad) {
        double load = currentLoad.doubleValue();
        double step = switch (system) {
            case "THRESHOLD" -> 14.0;
            case "VO2" -> 6.0;
            case "LONG_ENDURANCE" -> 36.0;
            default -> 10.0;
        };
        return Math.max(0, Math.min(10, (int) Math.round(load / step)));
    }

    private String progressionDescription(String system, String trend, BigDecimal currentLoad, BigDecimal targetLoad) {
        String base = switch (system) {
            case "THRESHOLD" -> "Próg";
            case "VO2" -> "VO2";
            case "LONG_ENDURANCE" -> "Długi tlen";
            default -> "System";
        };
        if ("NO_DATA".equals(trend)) {
            return base + " nie ma jeszcze dość danych, żeby ocenić stabilny trend.";
        }
        if ("UP".equals(trend)) {
            return "%s rośnie — bieżący blok niesie więcej trafionej pracy niż poprzedni.".formatted(base);
        }
        if ("DOWN".equals(trend)) {
            return "%s spadł względem poprzedniego bloku i warto pilnować brakującego bodźca.".formatted(base);
        }
        if (currentLoad.compareTo(targetLoad.multiply(BigDecimal.valueOf(0.9))) >= 0) {
            return "%s jest stabilny i blisko dawki docelowej dla aktualnego bloku.".formatted(base);
        }
        return "%s jest stabilny, ale nadal poniżej dawki, która zwykle daje mocniejszy efekt treningowy.".formatted(base);
    }

    private String progressionRecommendation(String system, BigDecimal currentLoad, BigDecimal targetLoad, String trend) {
        if (currentLoad.compareTo(targetLoad) >= 0 && !"DOWN".equals(trend)) {
            return switch (system) {
                case "THRESHOLD" -> "Broń jednego mocnego bodźca progowego i nie dokładaj drugiego na siłę.";
                case "VO2" -> "Utrzymaj jedną sesję VO2 i pilnuj świeżości przed kolejnym akcentem.";
                case "LONG_ENDURANCE" -> "Trzymaj regularny długi tlen i pilnuj fuelingu w końcówce.";
                default -> "Utrzymaj obecną strukturę pracy.";
            };
        }
        return switch (system) {
            case "THRESHOLD" -> "Dodaj lub obroń jedną jakościową sesję progową w najbliższych 7 dniach.";
            case "VO2" -> "Jeśli świeżość pozwoli, dołóż krótki akcent VO2 zamiast kolejnego neutralnego tempa.";
            case "LONG_ENDURANCE" -> "Przyda się kolejny długi tlen, najlepiej z równym tempem i dobrym fuelingiem.";
            default -> "Dołóż brakujący bodziec w kolejnym mikrocyklu.";
        };
    }

    private String classifyDurabilityTrend(int avgDurabilityScore, BigDecimal avgDecoupling, BigDecimal avgPowerFade) {
        if (avgDurabilityScore >= 75
                && avgDecoupling.compareTo(BigDecimal.valueOf(5)) < 0
                && avgPowerFade.compareTo(BigDecimal.valueOf(4)) < 0) {
            return "STABLE";
        }
        if (avgDurabilityScore < 55
                || avgDecoupling.compareTo(BigDecimal.valueOf(8)) >= 0
                || avgPowerFade.compareTo(BigDecimal.valueOf(6)) >= 0) {
            return "FADE_RISK";
        }
        return "BUILDING";
    }

    private String durabilityLabel(String trend) {
        return switch (trend) {
            case "STABLE" -> "Trzymasz końcówkę";
            case "FADE_RISK" -> "Końcówka siada";
            case "BUILDING" -> "Odporność rośnie";
            default -> "Brak danych";
        };
    }

    private String durabilityDescription(String trend, BigDecimal avgDecoupling, BigDecimal avgPowerFade) {
        String summary = switch (trend) {
            case "STABLE" -> "Średni drift i fade są niskie, więc długi tlen i końcówki sesji wyglądają stabilnie.";
            case "FADE_RISK" -> "W końcówce pracy widać wyraźny drift albo spadek mocy — warto pilnować fuelingu i trwałości tempa.";
            case "BUILDING" -> "Odporność jest jeszcze w budowie, ale bez mocnych czerwonych flag; dobry moment na kontrolowane długie tleny.";
            default -> "Brakuje dłuższych sesji z wiarygodnymi danymi, żeby ocenić odporność na zmęczenie.";
        };
        return summary + String.format(" Średnio decoupling %s%%, power fade %s%%.",
                avgDecoupling.setScale(1, RoundingMode.HALF_UP),
                avgPowerFade.setScale(1, RoundingMode.HALF_UP));
    }

    private List<ReadinessSessionVariantDto> buildSessionVariants(String dayType) {
        return switch (dayType) {
            case "OFF" -> List.of(
                    session("Pełne wolne", 0, "Brak", 0),
                    session("Mobilność", 20, "Bardzo lekko", 5),
                    session("Spacer / rozruch", 30, "Bardzo lekko", 10)
            );
            case "RECOVERY" -> List.of(
                    session("Krótka regeneracja", 30, "<55% FTP", 15),
                    session("Spokojny spin", 45, "55-60% FTP", 22),
                    session("Dłuższe rozkręcenie", 60, "55-60% FTP", 30)
            );
            case "ENDURANCE" -> List.of(
                    session("Krótki tlen", 45, "60-70% FTP", 35),
                    session("Tlen podstawowy", 75, "65-72% FTP", 52),
                    session("Długi tlen", 120, "65-72% FTP", 80)
            );
            case "TEMPO" -> List.of(
                    session("Tempo short", 45, "80-88% FTP", 45),
                    session("Tempo steady", 75, "80-88% FTP", 65),
                    session("Tempo + tlen", 105, "75-88% FTP", 82)
            );
            case "THRESHOLD" -> List.of(
                    session("Sweet spot", 45, "88-94% FTP", 52),
                    session("Próg", 75, "95-100% FTP", 72),
                    session("Długi próg", 105, "90-100% FTP", 88)
            );
            default -> List.of(
                    session("VO2 short", 45, "110-120% FTP", 55),
                    session("VO2 classic", 75, "108-120% FTP", 74),
                    session("Mocny akcent + tlen", 105, "70-120% FTP", 90)
            );
        };
    }

    private ReadinessSessionVariantDto session(String title, int durationMinutes, String targetPower, int targetTss) {
        return ReadinessSessionVariantDto.builder()
                .title(title)
                .durationMinutes(durationMinutes)
                .targetPower(targetPower)
                .targetTss(targetTss)
                .fuelingHint(buildFuelingHint(targetPower, durationMinutes, targetTss))
                .recoveryHint(buildRecoveryHint(targetPower, durationMinutes, targetTss))
                .build();
    }

    private String buildFuelingHint(String targetPower, int durationMinutes, int targetTss) {
        if (durationMinutes == 0) {
            return "Jedz normalnie; nie potrzebujesz dodatkowego ładowania pod tę opcję.";
        }
        if (isHighIntensity(targetPower, targetTss)) {
            return "Przed: lekki posiłek 2-3 h wcześniej. W trakcie: 60-80 g węgli/h + elektrolity.";
        }
        if (durationMinutes >= 45 || targetTss >= 35) {
            return "Przed: lekki posiłek 2-3 h wcześniej. W trakcie: 30-45 g węgli/h + bidon z elektrolitami.";
        }
        return "Lekki posiłek 2-3 h wcześniej, a w trakcie woda lub lekki bidon; 20-30 g węgli wystarczy przy końcówce sesji.";
    }

    private String buildRecoveryHint(String targetPower, int durationMinutes, int targetTss) {
        if (durationMinutes == 0) {
            return "Priorytet: sen, spacer i lekka mobilność zamiast dokładania kolejnego bodźca.";
        }
        if (isHighIntensity(targetPower, targetTss)) {
            return "Po treningu dołóż węgle + 20-30 g białka, schłodzenie 10 min i spokojny wieczór bez drugiego bodźca.";
        }
        if (durationMinutes >= 90 || targetTss >= 70) {
            return "Po treningu uzupełnij płyny i 20-30 g białka, a wieczorem postaw na spokojne nogi i sen.";
        }
        return "Po treningu 20-30 g białka, nawodnienie i krótka mobilność wystarczą.";
    }

    private boolean isHighIntensity(String targetPower, int targetTss) {
        return targetPower.contains("95-")
                || targetPower.contains("108-")
                || targetPower.contains("110-")
                || targetTss >= 74;
    }

    private String buildTomorrowHint(String dayType) {
        return switch (dayType) {
            case "OFF" -> "Jutro sprawdź świeżość; jeśli noga odżyje, wróć do lekkiego tlenu.";
            case "RECOVERY" -> "Jutro nadal trzymaj luz albo wejdź w spokojny tlen, jeśli samopoczucie się poprawi.";
            case "ENDURANCE" -> "Jutro nadal spokojnie albo wejście w tempo, jeśli noga będzie świeża.";
            case "TEMPO" -> "Jutro preferuj tlen lub lekką regenerację przed kolejnym mocniejszym akcentem.";
            case "THRESHOLD", "HIGH_INTENSITY" ->
                    "Jutro preferowana regeneracja albo bardzo lekki tlen; nie dokładaj drugiego mocnego dnia.";
            default -> "Jutro utrzymaj spokojniejszy dzień i obserwuj reakcję organizmu.";
        };
    }

    /**
     * Weekly training load with optimal bands based on CTL (Chronic Training Load).
     *
     * Uses the Acute:Chronic Workload Ratio (ACWR) framework:
     *   - optimalMin      = CTL × 7 × 0.8   (safe lower bound)
     *   - optimalTarget   = CTL × 7 × 1.0   (maintain fitness)
     *   - optimalMax      = CTL × 7 × 1.3   (safe upper build limit)
     *   - dangerThreshold = CTL × 7 × 1.5   (injury risk)
     */
    public List<WeeklyOptimalLoadDto> getWeeklyOptimalLoad(int weeks) {
        LocalDate now = LocalDate.now();
        LocalDate start = now.minusWeeks(weeks - 1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<Activity> activities = activityRepository.findByStartedAtBetween(
                startOfDay(start),
                startOfNextDay(now));

        Map<LocalDate, List<Activity>> weekGroups = groupActivitiesByWeekStart(activities);

        List<WeeklyOptimalLoadDto> result = new ArrayList<>();
        for (LocalDate weekStart = start; !weekStart.isAfter(now); weekStart = weekStart.plusWeeks(1)) {
            List<Activity> weekActivities = weekGroups.getOrDefault(weekStart, List.of());
            BigDecimal actualTss = sumWeeklyTss(weekActivities, weekStart, now);
            BigDecimal ctl = fetchCtlForWeek(weekStart);
            result.add(buildWeeklyOptimalLoadDto(weekStart, weekActivities.size(), actualTss, ctl));
        }
        return result;
    }

    private Map<LocalDate, List<Activity>> groupActivitiesByWeekStart(List<Activity> activities) {
        Map<LocalDate, List<Activity>> weekGroups = new LinkedHashMap<>();
        for (Activity a : activities) {
            if (a.getStartedAt() != null) {
                LocalDate weekStart = a.getStartedAt().toLocalDate()
                        .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                weekGroups.computeIfAbsent(weekStart, k -> new ArrayList<>()).add(a);
            }
        }
        return weekGroups;
    }

    private BigDecimal sumWeeklyTss(List<Activity> weekActivities, LocalDate weekStart, LocalDate now) {
        List<UUID> activityIds = weekActivities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tssValues = activityMetricRepository.findNumericValues(activityIds, TSS_METRIC);

        BigDecimal totalTss = BigDecimal.ZERO;
        for (BigDecimal val : tssValues.values()) {
            totalTss = totalTss.add(val);
        }
        if (totalTss.compareTo(BigDecimal.ZERO) == 0 && !weekActivities.isEmpty()) {
            LocalDate weekEnd = weekStart.plusDays(6);
            DateRange weekRange = DateRange.of(weekStart, weekEnd.isAfter(now) ? now : weekEnd);
            Map<LocalDate, BigDecimal> dailyTss = dailyMetricRepository.findNumericSeries("daily_tss", weekRange);
            for (BigDecimal val : dailyTss.values()) {
                totalTss = totalTss.add(val);
            }
        }
        return totalTss;
    }

    private BigDecimal fetchCtlForWeek(LocalDate weekStart) {
        return dailyMetricRepository.findNumericValue(weekStart, "ctl")
                .or(() -> dailyMetricRepository.findNumericValue(weekStart.minusDays(1), "ctl"))
                .or(() -> dailyMetricRepository.findNumericValue(weekStart.plusDays(1), "ctl"))
                .orElse(BigDecimal.ZERO);
    }

    private WeeklyOptimalLoadDto buildWeeklyOptimalLoadDto(
            LocalDate weekStart, int activityCount,
            BigDecimal actualTss, BigDecimal ctl) {

        if (ctl.compareTo(BigDecimal.ZERO) == 0) {
            return WeeklyOptimalLoadDto.builder()
                    .weekStart(weekStart)
                    .activityCount(activityCount)
                    .actualTss(actualTss)
                    .ctl(BigDecimal.ZERO)
                    .optimalMin(BigDecimal.ZERO)
                    .optimalTarget(BigDecimal.ZERO)
                    .optimalMax(BigDecimal.ZERO)
                    .dangerThreshold(BigDecimal.ZERO)
                    .status("NO_DATA")
                    .build();
        }

        double ctlValue = ctl.doubleValue();
        double weeklyCtl = ctlValue * DAYS_PER_WEEK;
        BigDecimal optimalMin = round(weeklyCtl * ACWR_OPTIMAL_MIN);
        BigDecimal optimalTarget = round(weeklyCtl);
        BigDecimal optimalMax = round(weeklyCtl * ACWR_OPTIMAL_MAX);
        BigDecimal dangerThreshold = round(weeklyCtl * ACWR_DANGER);

        String status = determineLoadStatus(actualTss.doubleValue(), weeklyCtl);

        return WeeklyOptimalLoadDto.builder()
                .weekStart(weekStart)
                .activityCount(activityCount)
                .actualTss(actualTss)
                .ctl(ctl)
                .optimalMin(optimalMin)
                .optimalTarget(optimalTarget)
                .optimalMax(optimalMax)
                .dangerThreshold(dangerThreshold)
                .status(status)
                .build();
    }

    private String determineLoadStatus(double actualTss, double weeklyCtl) {
        if (actualTss >= weeklyCtl * ACWR_DANGER) return "DANGER";
        if (actualTss >= weeklyCtl * ACWR_OPTIMAL_MAX) return "OVER";
        if (actualTss >= weeklyCtl * ACWR_OPTIMAL_MIN) return "OPTIMAL";
        if (actualTss >= weeklyCtl * ACWR_INSUFFICIENT) return "UNDER";
        return "INSUFFICIENT";
    }

    /**
     * Daily training load with optimal TSS bands for past days plus a forward projection.
     *
     * Past days: actual TSS + CTL/ATL/TSB read from the database.
     * Future days: projected CTL/ATL/TSB using EMA assuming TSS = CTL each day
     * (the "maintain fitness" trajectory).
     *
     * @param pastDays   number of historical days to include (default 60)
     * @param futureDays number of projection days beyond today (default 21)
     */
    public List<DailyOptimalLoadDto> getDailyOptimalLoad(int pastDays, int futureDays) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(pastDays - 1);
        LocalDate end = today.plusDays(futureDays);

        // Fetch historical daily TSS and PMC series from DB
        DateRange pastRange = DateRange.of(start, today);
        Map<LocalDate, BigDecimal> dailyTss = dailyMetricRepository.findNumericSeries("daily_tss", pastRange);
        Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", pastRange);
        Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", pastRange);
        Map<LocalDate, BigDecimal> tsbSeries = dailyMetricRepository.findNumericSeries("tsb", pastRange);
        ProjectionPattern projectionPattern = estimateProjectionPattern(
                dailyTss,
                today.minusDays(Math.min(pastDays - 1, TRAINING_PATTERN_LOOKBACK_DAYS - 1)),
                today);

        List<DailyOptimalLoadDto> result = new ArrayList<>();

        // --- Past days ---
        for (LocalDate date = start; !date.isAfter(today); date = date.plusDays(1)) {
            BigDecimal ctl = ctlSeries.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal atl = atlSeries.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal tsb = tsbSeries.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal tss = dailyTss.getOrDefault(date, null);
            boolean trainingDay = isTrainingDay(tss);

            result.add(buildDailyOptimalLoadDto(
                    date,
                    tss,
                    null,
                    ctl,
                    atl,
                    tsb,
                    false,
                    trainingDay,
                    projectionPattern.trainingDaysPerWeek()));
        }

        // --- Future projection (maintain fitness, but respect recent rest/training rhythm) ---
        BigDecimal projCtl = ctlSeries.getOrDefault(today, BigDecimal.ZERO);
        BigDecimal projAtl = atlSeries.getOrDefault(today, BigDecimal.ZERO);

        for (int i = 1; i <= futureDays; i++) {
            LocalDate futureDate = today.plusDays(i);
            boolean trainingDay = projectionPattern.isTrainingDay(futureDate.getDayOfWeek());
            DailyTargets projectedTargets = calculateDailyTargets(
                    projCtl,
                    trainingDay,
                    projectionPattern.trainingDaysPerWeek());
            double ctl = projCtl.doubleValue();
            double atl = projAtl.doubleValue();
            double targetTss = projectedTargets.optimalTarget().doubleValue();

            // Advance EMA one day
            double newCtl = ctl + (targetTss - ctl) / 42.0;
            double newAtl = atl + (targetTss - atl) / 7.0;
            double newTsb = ctl - atl; // TSB = yesterday's CTL - ATL

            projCtl = round(newCtl);
            projAtl = round(newAtl);

            result.add(buildDailyOptimalLoadDto(
                    futureDate,
                    null,
                    projectedTargets.optimalTarget(),
                    projCtl,
                    projAtl,
                    round(newTsb),
                    true,
                    trainingDay,
                    projectionPattern.trainingDaysPerWeek()));
        }

        return result;
    }

    private DailyOptimalLoadDto buildDailyOptimalLoadDto(
            LocalDate date, BigDecimal actualTss, BigDecimal projectedTss,
            BigDecimal ctl, BigDecimal atl, BigDecimal tsb,
            boolean future,
            boolean trainingDay,
            int trainingDaysPerWeek) {

        DailyTargets targets = calculateDailyTargets(ctl, trainingDay, trainingDaysPerWeek);
        if (ctl.compareTo(BigDecimal.ZERO) == 0) {
            return DailyOptimalLoadDto.builder()
                    .date(date).actualTss(actualTss).projectedTss(projectedTss).ctl(ctl).atl(atl).tsb(tsb)
                    .optimalMin(BigDecimal.ZERO).optimalTarget(BigDecimal.ZERO)
                    .optimalMax(BigDecimal.ZERO).dangerThreshold(BigDecimal.ZERO)
                    .status(future ? "FUTURE" : "NO_DATA").future(future)
                    .build();
        }

        String status;
        if (future) {
            status = "FUTURE";
        } else if (!trainingDay || actualTss == null || actualTss.compareTo(BigDecimal.ZERO) == 0) {
            status = "NO_DATA";
        } else {
            double tssVal = actualTss.doubleValue();
            double optimalMin = targets.optimalMin().doubleValue();
            double optimalTarget = targets.optimalTarget().doubleValue();
            double optimalMax = targets.optimalMax().doubleValue();
            double dangerThreshold = targets.dangerThreshold().doubleValue();
            if (tssVal >= dangerThreshold) status = "DANGER";
            else if (tssVal >= optimalMax) status = "OVER";
            else if (tssVal >= optimalMin) status = "OPTIMAL";
            else if (tssVal >= optimalTarget * ACWR_INSUFFICIENT) status = "UNDER";
            else status = "INSUFFICIENT";
        }

        return DailyOptimalLoadDto.builder()
                .date(date).actualTss(actualTss).projectedTss(projectedTss).ctl(ctl).atl(atl).tsb(tsb)
                .optimalMin(targets.optimalMin()).optimalTarget(targets.optimalTarget())
                .optimalMax(targets.optimalMax()).dangerThreshold(targets.dangerThreshold())
                .status(status).future(future)
                .build();
    }

    private ProjectionPattern estimateProjectionPattern(
            Map<LocalDate, BigDecimal> dailyTss,
            LocalDate start,
            LocalDate end) {
        Map<DayOfWeek, Integer> trainingCounts = new EnumMap<>(DayOfWeek.class);
        int observedDays = 0;
        int trainingDayCount = 0;

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            observedDays++;
            if (isTrainingDay(dailyTss.get(date))) {
                trainingCounts.merge(date.getDayOfWeek(), 1, Integer::sum);
                trainingDayCount++;
            }
        }

        if (observedDays == 0 || trainingDayCount == 0) {
            return ProjectionPattern.everyDay();
        }

        int projectedTrainingDays = Math.max(
                1,
                Math.min(DAYS_PER_WEEK, (int) Math.round((double) trainingDayCount * DAYS_PER_WEEK / observedDays)));

        Set<DayOfWeek> projectedWeekdays = trainingCounts.entrySet().stream()
                .sorted(Map.Entry.<DayOfWeek, Integer>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(entry -> entry.getKey().getValue()))
                .limit(projectedTrainingDays)
                .map(Map.Entry::getKey)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(DayOfWeek.class)));

        if (projectedWeekdays.isEmpty()) {
            return ProjectionPattern.everyDay();
        }

        return new ProjectionPattern(projectedWeekdays);
    }

    private DailyTargets calculateDailyTargets(BigDecimal ctl, boolean trainingDay, int trainingDaysPerWeek) {
        if (ctl.compareTo(BigDecimal.ZERO) <= 0 || !trainingDay) {
            return DailyTargets.rest();
        }

        double weeklyCtl = ctl.doubleValue() * DAYS_PER_WEEK;
        double divisor = Math.max(1, trainingDaysPerWeek);
        return new DailyTargets(
                round(weeklyCtl * ACWR_OPTIMAL_MIN / divisor),
                round(weeklyCtl / divisor),
                round(weeklyCtl * ACWR_OPTIMAL_MAX / divisor),
                round(weeklyCtl * ACWR_DANGER / divisor));
    }

    private boolean isTrainingDay(BigDecimal tss) {
        return tss != null && tss.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Weekly MMP: for each ISO week in the range, return the best power at each
     * standard duration across all activities that week.
     */
    public List<WeeklyMmpDto> getWeeklyMmp(LocalDate from, LocalDate to) {
        List<Activity> activities = findActivitiesBetween(from, to);

        Map<LocalDate, Map<Integer, Double>> weekBests = new TreeMap<>();

        for (Activity a : activities) {
            if (a.getStartedAt() == null) {
                continue;
            }
            LocalDate weekStart = a.getStartedAt().toLocalDate()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

            activityMetricRepository.findJsonValue(a.getId(), POWER_CURVE_METRIC)
                    .ifPresent(curveJson -> {
                        Object effortsObj = curveJson.get("efforts");
                        if (effortsObj instanceof Map<?, ?> effortsMap) {
                            Map<Integer, Double> best = weekBests.computeIfAbsent(weekStart, k -> new TreeMap<>());
                            for (Map.Entry<?, ?> e : effortsMap.entrySet()) {
                                int duration = Integer.parseInt(String.valueOf(e.getKey()));
                                double watts = Double.parseDouble(String.valueOf(e.getValue()));
                                best.merge(duration, watts, Double::max);
                            }
                        }
                    });
        }

        List<WeeklyMmpDto> result = new ArrayList<>();
        for (Map.Entry<LocalDate, Map<Integer, Double>> entry : weekBests.entrySet()) {
            LocalDate weekStart = entry.getKey();
            int isoYear = weekStart.get(IsoFields.WEEK_BASED_YEAR);
            int isoWeek = weekStart.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            String label = String.format("%d-W%02d", isoYear, isoWeek);

            Map<String, Integer> labeled = new LinkedHashMap<>();
            for (Map.Entry<Integer, Double> e : entry.getValue().entrySet()) {
                String durationLabel = DURATION_LABELS.getOrDefault(e.getKey(), e.getKey() + "s");
                labeled.put(durationLabel, (int) Math.round(e.getValue()));
            }
            result.add(new WeeklyMmpDto(label, weekStart, labeled));
        }
        return result;
    }

    // ── Training Phase Detection ─────────────────────────────────────────

    private static final int PHASE_ROLLING_WEEKS = 4;
    private static final double RECOVERY_TSS_RATIO = 0.60;
    private static final double RECOVERY_TSB_THRESHOLD = 10.0;
    private static final double BASE_IF_CEILING = 0.65;
    private static final double PEAK_IF_FLOOR = 0.75;
    private static final double PEAK_CTL_RATIO = 0.80;

    /**
     * Detect training phases (BASE, BUILD, PEAK, RECOVERY) for each ISO week
     * in the given date range and compute a periodization score.
     */
    public TrainingPhaseAnalysis detectTrainingPhases(LocalDate from, LocalDate to) {
        LocalDate weekStart = from.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = to;

        DateRange fullRange = DateRange.of(weekStart, weekEnd);
        Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", fullRange);
        Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", fullRange);
        Map<LocalDate, BigDecimal> tsbSeries = dailyMetricRepository.findNumericSeries("tsb", fullRange);
        Map<LocalDate, BigDecimal> dailyTss = dailyMetricRepository.findNumericSeries("daily_tss", fullRange);

        List<Activity> activities = findActivitiesBetween(from, to);

        // Build per-week aggregates
        List<WeekAgg> weekAggs = new ArrayList<>();
        for (LocalDate ws = weekStart; !ws.isAfter(weekEnd); ws = ws.plusWeeks(1)) {
            LocalDate we = ws.plusDays(6);
            if (we.isAfter(weekEnd)) we = weekEnd;
            weekAggs.add(buildWeekAgg(ws, we, ctlSeries, atlSeries, tsbSeries, dailyTss, activities));
        }

        if (weekAggs.isEmpty()) {
            return new TrainingPhaseAnalysis(List.of(), "UNKNOWN",
                    "Brak danych do analizy faz treningowych.", 0);
        }

        // Classify each week
        double periodMaxCtl = weekAggs.stream().mapToDouble(w -> w.avgCtl).max().orElse(0);
        List<TrainingPhaseAnalysis.WeekPhase> phases = new ArrayList<>();

        for (int i = 0; i < weekAggs.size(); i++) {
            WeekAgg current = weekAggs.get(i);
            double rollingAvgTss = rollingAvgTss(weekAggs, i, PHASE_ROLLING_WEEKS);
            double prevAvgCtl = rollingAvgField(weekAggs, i, PHASE_ROLLING_WEEKS, w -> w.avgCtl);
            double prevAvgVolume = rollingAvgField(weekAggs, i, PHASE_ROLLING_WEEKS, w -> (double) w.totalDurationMin);

            String phase = classifyPhase(current, rollingAvgTss, prevAvgCtl, prevAvgVolume, periodMaxCtl);

            int isoYear = current.weekStart.get(IsoFields.WEEK_BASED_YEAR);
            int isoWeek = current.weekStart.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            String label = String.format("%d-W%02d", isoYear, isoWeek);

            phases.add(new TrainingPhaseAnalysis.WeekPhase(
                    label, current.weekStart, phase,
                    round(current.avgCtl).doubleValue(),
                    round(current.avgAtl).doubleValue(),
                    round(current.avgTsb).doubleValue(),
                    round(current.totalTss).doubleValue(),
                    round(current.avgIf).doubleValue(),
                    current.totalDurationMin));
        }

        String currentPhase = phases.get(phases.size() - 1).phase();
        String recommendation = phaseRecommendation(currentPhase);
        int periodizationScore = computePeriodizationScore(phases);

        return new TrainingPhaseAnalysis(phases, currentPhase, recommendation, periodizationScore);
    }

    private String classifyPhase(WeekAgg week, double rollingAvgTss,
                                 double prevAvgCtl, double prevAvgVolume,
                                 double periodMaxCtl) {
        // RECOVERY: low volume or high TSB
        if ((rollingAvgTss > 0 && week.totalTss < rollingAvgTss * RECOVERY_TSS_RATIO)
                || week.avgTsb > RECOVERY_TSB_THRESHOLD) {
            return "RECOVERY";
        }
        // PEAK: high intensity or near-max CTL with declining volume
        if (week.avgIf > PEAK_IF_FLOOR
                || (periodMaxCtl > 0 && week.avgCtl > periodMaxCtl * PEAK_CTL_RATIO
                    && week.totalDurationMin < prevAvgVolume * 0.95)) {
            return "PEAK";
        }
        // BASE: low intensity with rising CTL
        boolean ctlRising = week.avgCtl > prevAvgCtl;
        boolean volumeStableOrRising = week.totalDurationMin >= prevAvgVolume * 0.90;
        if (week.avgIf < BASE_IF_CEILING && ctlRising && volumeStableOrRising) {
            return "BASE";
        }
        // BUILD: default when CTL and volume both rising with moderate-high IF
        if (ctlRising && week.totalDurationMin >= prevAvgVolume * 0.90) {
            return "BUILD";
        }
        // Fallback
        return "BUILD";
    }

    private String phaseRecommendation(String currentPhase) {
        return switch (currentPhase) {
            case "BASE" -> "Faza bazowa — kontynuuj budowanie objętości przy niskiej intensywności. "
                    + "Skup się na długich, spokojnych treningach.";
            case "BUILD" -> "Faza budowania — zwiększaj intensywność stopniowo. "
                    + "Dodawaj interwały i tempo, monitoruj zmęczenie.";
            case "PEAK" -> "Faza szczytowa — utrzymuj wysoką jakość sesji, zacznij redukować objętość. "
                    + "Przygotuj się do wyścigu lub testu.";
            case "RECOVERY" -> "Faza regeneracji — priorytetem jest odpoczynek. "
                    + "Lekkie treningi, rozciąganie, dobry sen.";
            default -> "Kontynuuj obecny plan treningowy i monitoruj obciążenie.";
        };
    }

    private int computePeriodizationScore(List<TrainingPhaseAnalysis.WeekPhase> phases) {
        if (phases.size() < 3) return 50;

        int score = 50;
        int transitions = 0;
        boolean hasBase = false, hasBuild = false, hasPeak = false, hasRecovery = false;

        for (int i = 0; i < phases.size(); i++) {
            String phase = phases.get(i).phase();
            if ("BASE".equals(phase)) hasBase = true;
            if ("BUILD".equals(phase)) hasBuild = true;
            if ("PEAK".equals(phase)) hasPeak = true;
            if ("RECOVERY".equals(phase)) hasRecovery = true;

            if (i > 0 && !phases.get(i).phase().equals(phases.get(i - 1).phase())) {
                transitions++;
            }
        }

        // Bonus for having diverse phases (structured periodization)
        int phaseCount = (hasBase ? 1 : 0) + (hasBuild ? 1 : 0) + (hasPeak ? 1 : 0) + (hasRecovery ? 1 : 0);
        score += phaseCount * 8;

        // Bonus for phase transitions (not too few, not too many)
        int idealTransitions = Math.max(1, phases.size() / 3);
        int transitionDiff = Math.abs(transitions - idealTransitions);
        score += Math.max(0, 18 - transitionDiff * 6);

        return Math.max(0, Math.min(100, score));
    }

    private record WeekAgg(
            LocalDate weekStart, double avgCtl, double avgAtl, double avgTsb,
            double totalTss, double avgIf, int totalDurationMin
    ) {}

    private WeekAgg buildWeekAgg(LocalDate ws, LocalDate we,
                                  Map<LocalDate, BigDecimal> ctlSeries,
                                  Map<LocalDate, BigDecimal> atlSeries,
                                  Map<LocalDate, BigDecimal> tsbSeries,
                                  Map<LocalDate, BigDecimal> dailyTss,
                                  List<Activity> allActivities) {
        double sumCtl = 0, sumAtl = 0, sumTsb = 0, totalTss = 0;
        int dayCount = 0;
        for (LocalDate d = ws; !d.isAfter(we); d = d.plusDays(1)) {
            sumCtl += ctlSeries.getOrDefault(d, BigDecimal.ZERO).doubleValue();
            sumAtl += atlSeries.getOrDefault(d, BigDecimal.ZERO).doubleValue();
            sumTsb += tsbSeries.getOrDefault(d, BigDecimal.ZERO).doubleValue();
            totalTss += dailyTss.getOrDefault(d, BigDecimal.ZERO).doubleValue();
            dayCount++;
        }

        int totalDurMin = 0;
        double sumIf = 0;
        int ifCount = 0;
        for (Activity a : allActivities) {
            if (a.getStartedAt() == null) continue;
            LocalDate aDate = a.getStartedAt().toLocalDate();
            if (!aDate.isBefore(ws) && !aDate.isAfter(we)) {
                if (a.getMovingTimeSec() != null) totalDurMin += a.getMovingTimeSec() / 60;
                var ifOpt = activityMetricRepository.findNumericValue(a.getId(), "intensity_factor");
                if (ifOpt.isPresent()) {
                    sumIf += ifOpt.get().doubleValue();
                    ifCount++;
                }
            }
        }

        double avgIf = ifCount > 0 ? sumIf / ifCount : 0;
        return new WeekAgg(ws,
                dayCount > 0 ? sumCtl / dayCount : 0,
                dayCount > 0 ? sumAtl / dayCount : 0,
                dayCount > 0 ? sumTsb / dayCount : 0,
                totalTss, avgIf, totalDurMin);
    }

    private double rollingAvgTss(List<WeekAgg> weeks, int currentIdx, int windowSize) {
        int start = Math.max(0, currentIdx - windowSize);
        int count = 0;
        double sum = 0;
        for (int i = start; i < currentIdx; i++) {
            sum += weeks.get(i).totalTss;
            count++;
        }
        return count > 0 ? sum / count : 0;
    }

    private double rollingAvgField(List<WeekAgg> weeks, int currentIdx, int windowSize,
                                    java.util.function.ToDoubleFunction<WeekAgg> fieldExtractor) {
        int start = Math.max(0, currentIdx - windowSize);
        int count = 0;
        double sum = 0;
        for (int i = start; i < currentIdx; i++) {
            sum += fieldExtractor.applyAsDouble(weeks.get(i));
            count++;
        }
        return count > 0 ? sum / count : 0;
    }

    // ── Race Readiness Projection ─────────────────────────────────────────

    private static final double CTL_TIME_CONSTANT = 42.0;
    private static final double ATL_TIME_CONSTANT = 7.0;
    private static final double IDEAL_TSB_MIN = 5.0;
    private static final double IDEAL_TSB_MAX = 25.0;

    /**
     * Project CTL/ATL/TSB forward to a race date using the Banister model,
     * recommend a taper strategy, and assess projected form.
     */
    public RaceReadinessProjection projectRaceReadiness(LocalDate raceDate) {
        LocalDate today = LocalDate.now();
        int daysUntilRace = (int) ChronoUnit.DAYS.between(today, raceDate);

        double currentCtl = dailyMetricRepository.findNumericValue(today, "ctl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "ctl"))
                .orElse(BigDecimal.ZERO).doubleValue();
        double currentAtl = dailyMetricRepository.findNumericValue(today, "atl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "atl"))
                .orElse(BigDecimal.ZERO).doubleValue();
        double currentTsb = currentCtl - currentAtl;

        // Estimate average daily TSS from recent 4 weeks
        DateRange recentRange = DateRange.of(today.minusDays(28), today);
        Map<LocalDate, BigDecimal> recentTss = dailyMetricRepository.findNumericSeries("daily_tss", recentRange);
        double totalRecentTss = recentTss.values().stream().mapToDouble(BigDecimal::doubleValue).sum();
        double avgDailyTss = recentTss.isEmpty() ? currentCtl : totalRecentTss / 28.0;

        List<RaceReadinessProjection.DailyProjection> projections = new ArrayList<>();
        double ctl = currentCtl;
        double atl = currentAtl;

        for (int day = 1; day <= Math.max(daysUntilRace, 0); day++) {
            double taperFactor = computeTaperFactor(daysUntilRace - day + 1, daysUntilRace);
            double plannedTss = avgDailyTss * taperFactor;

            ctl = ctl + (plannedTss - ctl) / CTL_TIME_CONSTANT;
            atl = atl + (plannedTss - atl) / ATL_TIME_CONSTANT;
            double tsb = ctl - atl;

            projections.add(new RaceReadinessProjection.DailyProjection(
                    today.plusDays(day),
                    Math.round(ctl * 10) / 10.0,
                    Math.round(atl * 10) / 10.0,
                    Math.round(tsb * 10) / 10.0));
        }

        double projectedCtl = projections.isEmpty() ? currentCtl : projections.get(projections.size() - 1).ctl();
        double projectedTsb = projections.isEmpty() ? currentTsb : projections.get(projections.size() - 1).tsb();

        String formAssessment = assessForm(projectedTsb, projectedCtl);
        String taperRecommendation = buildTaperRecommendation(daysUntilRace);

        return new RaceReadinessProjection(
                raceDate, daysUntilRace,
                Math.round(currentCtl * 10) / 10.0,
                Math.round(currentAtl * 10) / 10.0,
                Math.round(currentTsb * 10) / 10.0,
                Math.round(projectedCtl * 10) / 10.0,
                Math.round(projectedTsb * 10) / 10.0,
                formAssessment, taperRecommendation, projections);
    }

    private double computeTaperFactor(int daysRemaining, int totalDays) {
        if (daysRemaining > 21) return 1.0;
        if (daysRemaining > 14) return 0.75;
        if (daysRemaining > 7) return 0.55;
        return 0.35;
    }

    String assessForm(double tsb, double ctl) {
        if (tsb >= IDEAL_TSB_MIN && tsb <= IDEAL_TSB_MAX && ctl > 0) return "Świetna";
        if (tsb >= 0 && tsb < IDEAL_TSB_MIN) return "Dobra";
        if (tsb >= -10 && tsb < 0) return "Przeciętna";
        return "Zmęczony";
    }

    String buildTaperRecommendation(int daysUntilRace) {
        if (daysUntilRace > 21) {
            return "Do wyścigu pozostało ponad 3 tygodnie. Kontynuuj normalny trening, "
                    + "utrzymuj lub zwiększaj obciążenie. Taper rozpocznij około 2-3 tygodnie przed startem.";
        }
        if (daysUntilRace > 14) {
            return "Czas rozpocząć taper. Zredukuj objętość o 20-30%, "
                    + "utrzymaj intensywność na dotychczasowym poziomie. Skup się na jakości sesji.";
        }
        if (daysUntilRace > 7) {
            return "Faza głębokiego taperu. Zredukuj objętość o 40-50%, "
                    + "utrzymaj krótkie, intensywne interwały. Priorytet: regeneracja i sen.";
        }
        if (daysUntilRace > 0) {
            return "Ostatni tydzień przed wyścigiem. Zredukuj objętość o 60-70%, "
                    + "tylko lekkie openery 1-2 dni przed startem. Odpoczywaj i ładuj energię.";
        }
        return "Dzień wyścigu lub po nim. Skup się na wykonaniu i regeneracji.";
    }

    /**
     * Retrieve stored W' Balance metric for a single activity.
     */
    public Map<String, Object> getWPrimeBalance(UUID activityId) {
        return activityMetricRepository.findJsonValue(activityId, W_PRIME_BALANCE_METRIC)
                .orElse(Map.of());
    }

    private List<Activity> findActivitiesBetween(LocalDate from, LocalDate to) {
        return activityRepository.findByStartedAtBetween(startOfDay(from), startOfNextDay(to));
    }

    private OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
    }

    private OffsetDateTime startOfNextDay(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
    }

    private BigDecimal round(double value) {
        return BigDecimal.valueOf(Math.round(value * 10) / 10.0);
    }

    private record ProjectionPattern(Set<DayOfWeek> trainingDays) {
        private static ProjectionPattern everyDay() {
            return new ProjectionPattern(EnumSet.allOf(DayOfWeek.class));
        }

        private int trainingDaysPerWeek() {
            return Math.max(1, trainingDays.size());
        }

        private boolean isTrainingDay(DayOfWeek dayOfWeek) {
            return trainingDays.contains(dayOfWeek);
        }
    }

    private record DailyTargets(
            BigDecimal optimalMin,
            BigDecimal optimalTarget,
            BigDecimal optimalMax,
            BigDecimal dangerThreshold) {
        private static DailyTargets rest() {
            return new DailyTargets(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }
}
