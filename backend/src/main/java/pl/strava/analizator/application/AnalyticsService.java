package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
import pl.strava.analizator.application.dto.FtpProgressDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.PowerCurveDto;
import pl.strava.analizator.application.dto.RaceReadinessProjection;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.TrainingPhaseAnalysis;
import pl.strava.analizator.application.dto.TrendDto;
import pl.strava.analizator.application.dto.WeeklyMmpDto;
import pl.strava.analizator.application.dto.WeeklyOptimalLoadDto;
import pl.strava.analizator.application.dto.WeeklySummaryDto;
import pl.strava.analizator.application.dto.ZoneDistributionDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
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

        int score = (int) Math.round(Math.max(0, Math.min(100, tsbScore + fitnessBonus - fatiguePenalty)));

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
                .build();
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
