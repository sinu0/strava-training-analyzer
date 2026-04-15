package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.domain.metrics.DailyTrainingLoad;
import pl.strava.analizator.domain.metrics.calculator.CtlAtlTsbCalculator;
import pl.strava.analizator.domain.metrics.calculator.TrainingMonotonyCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyMetricsService {

    private static final String TSS_METRIC = "training_stress_score";
    private static final String HR_TSS_METRIC = "hr_training_stress_score";
    private static final String EF_METRIC = "efficiency_factor";
    private static final String NP_METRIC = "normalized_power";
    private static final String POWER_CURVE_METRIC = "power_curve";
    // Correction factors for estimating FTP from TRAINING-RIDE best efforts.
    // These differ from the Coggan 20-min TEST protocol (0.95) because training-ride
    // segments lack the pre-depletion warm-up and are not all-out maximal test efforts.
    // Sources: Frontiers in Physiology 2020 (CP vs FTP study), Coggan Power Profiling.
    private static final double FACTOR_FROM_20MIN = 0.87; // ~87% of best training 20-min window
    private static final double FACTOR_FROM_30MIN = 0.91; // ~91% of best training 30-min effort
    private static final double FACTOR_FROM_60MIN = 1.00; // 60-min best IS FTP by definition

    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final CtlAtlTsbCalculator ctlAtlTsbCalculator;
    private final TrainingMonotonyCalculator trainingMonotonyCalculator;

    /**
     * Daily rollup at 00:30 UTC — extends CTL/ATL/TSB to today even without a manual sync.
     * Ensures the PMC chart always has today's data point.
     */
    @Scheduled(cron = "0 30 0 * * *")
    public void scheduledDailyRollup() {
        log.info("Running scheduled daily metrics rollup");
        try {
            recalculateAll();
        } catch (Exception e) {
            log.warn("Scheduled daily rollup failed: {}", e.getMessage());
        }
    }

    public void recalculateAll() {
        List<Activity> activities = activityRepository.findByStartedAtBetween(
                OffsetDateTime.now(ZoneOffset.UTC).minusYears(20),
                OffsetDateTime.now(ZoneOffset.UTC).plusDays(1));
        if (activities.isEmpty()) {
            return;
        }

        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);

        // Always estimate FTP from activity power curves so the history reflects real progression.
        double estimatedFtp = estimateFtpFromPowerCurves(activities);

        // Effective FTP for TSS calculation: take the better of the two.
        // Profile FTP (if formally tested) acts as a floor — never go below it.
        double profileFtpValue = (profile != null && profile.hasFtp()) ? profile.getFtpWatts() : 0;
        double effectiveFtp = Math.max(estimatedFtp, profileFtpValue);

        List<DailyTrainingLoad> loads = buildDailyLoads(activities, effectiveFtp);
        if (loads.isEmpty()) {
            return;
        }

        saveDailyTss(loads);
        savePmc(loads);
        saveTrainingMonotony(loads, profile);
        // Write today's effective FTP; full history is backfilled once by backfillFtpHistory()
        saveFtp(effectiveFtp);
        saveDailyActivityMetrics(activities);
    }

    /**
     * Rebuild FTP history from scratch using all activities. Called once (or on demand)
     * to populate the full historical FTP trend. Normal syncs just update today's value.
     */
    public void rebuildFtpHistory() {
        List<Activity> all = activityRepository.findByStartedAtBetween(
                OffsetDateTime.now(ZoneOffset.UTC).minusYears(20),
                OffsetDateTime.now(ZoneOffset.UTC).plusDays(1));
        if (all.isEmpty()) return;
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        double floor = (profile != null && profile.hasFtp()) ? profile.getFtpWatts() : 0;
        log.info("Rebuilding FTP history from {} activities", all.size());
        backfillFtpHistory(all, floor);
        log.info("FTP history rebuild complete");
    }

    /**
     * Aggregate per-activity numeric metrics (EF, NP) into daily values (average per day).
     */
    private void saveDailyActivityMetrics(List<Activity> activities) {
        Map<LocalDate, List<BigDecimal>> efByDate = new TreeMap<>();
        Map<LocalDate, List<BigDecimal>> npByDate = new TreeMap<>();

        for (Activity activity : activities) {
            if (activity.getStartedAt() == null) continue;
            LocalDate date = activity.getStartedAt().toLocalDate();

            activityMetricRepository.findNumericValue(activity.getId(), EF_METRIC)
                    .ifPresent(v -> efByDate.computeIfAbsent(date, k -> new ArrayList<>()).add(v));
            activityMetricRepository.findNumericValue(activity.getId(), NP_METRIC)
                    .ifPresent(v -> npByDate.computeIfAbsent(date, k -> new ArrayList<>()).add(v));
        }

        efByDate.forEach((date, values) -> {
            BigDecimal avg = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP);
            dailyMetricRepository.save(date, MetricResult.numeric(EF_METRIC, avg));
        });

        npByDate.forEach((date, values) -> {
            BigDecimal avg = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
            dailyMetricRepository.save(date, MetricResult.numeric(NP_METRIC, avg));
        });
    }

    private List<DailyTrainingLoad> buildDailyLoads(List<Activity> activities, double effectiveFtp) {
        Map<LocalDate, BigDecimal> byDate = new TreeMap<>();

        for (Activity activity : activities) {
            if (activity.getStartedAt() == null) {
                continue;
            }
            BigDecimal tss = activityMetricRepository.findNumericValue(activity.getId(), TSS_METRIC)
                    .or(() -> activityMetricRepository.findNumericValue(activity.getId(), HR_TSS_METRIC))
                    .orElse(null);

            // Estimate TSS from NP if not available and we have an effective FTP
            if (tss == null && effectiveFtp > 0) {
                tss = estimateTssFromNp(activity, effectiveFtp);
            }

            if (tss == null) {
                tss = BigDecimal.ZERO;
            }

            byDate.merge(activity.getStartedAt().toLocalDate(), tss, BigDecimal::add);
        }

        if (byDate.isEmpty()) {
            return List.of();
        }

        LocalDate start = byDate.keySet().iterator().next();
        LocalDate end = LocalDate.now(ZoneOffset.UTC);
        List<DailyTrainingLoad> loads = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            loads.add(DailyTrainingLoad.builder()
                    .date(date)
                    .tss(byDate.getOrDefault(date, BigDecimal.ZERO))
                    .build());
        }
        return loads;
    }

    /**
     * Estimate TSS from NP: TSS = (duration × NP × IF) / (FTP × 3600) × 100
     * where IF = NP / FTP
     */
    private BigDecimal estimateTssFromNp(Activity activity, double ftp) {
        Optional<BigDecimal> npOpt = activityMetricRepository.findNumericValue(activity.getId(), NP_METRIC);
        if (npOpt.isEmpty() || activity.getMovingTimeSec() == null) {
            return null;
        }
        double np = npOpt.get().doubleValue();
        double intensityFactor = np / ftp;
        double tss = (activity.getMovingTimeSec() * np * intensityFactor) / (ftp * 3600.0) * 100.0;
        return BigDecimal.valueOf(tss).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Estimate FTP from the best power-curve efforts stored across all activities.
     * Profile FTP is NOT used here — the estimate always reflects actual training progression.
     * Profile FTP acts as a floor in {@link #recalculateAll()}.
     *
     * <p>Algorithm (median of available estimates):
     * <ol>
     *   <li>Best 60-min average × 1.00 (60-min effort IS FTP by definition)</li>
     *   <li>Best 30-min average × 0.91 (conservative factor for training rides)</li>
     *   <li>Best 20-min average × 0.87 (vs 0.95 for a dedicated test)</li>
     *   <li>2-parameter Critical Power model across 5/10/20/30-min durations</li>
     * </ol>
     */
    private double estimateFtpFromPowerCurves(List<Activity> activities) {
        double best5min  = 0;
        double best10min = 0;
        double best20min = 0;
        double best30min = 0;
        double best60min = 0;

        for (Activity activity : activities) {
            Optional<Map<String, Object>> curveOpt =
                    activityMetricRepository.findJsonValue(activity.getId(), POWER_CURVE_METRIC);
            if (curveOpt.isEmpty()) continue;

            Object effortsObj = curveOpt.get().get("efforts");
            if (!(effortsObj instanceof Map<?, ?> effortsMap)) continue;

            best5min  = Math.max(best5min,  extractPower(effortsMap, 300));
            best10min = Math.max(best10min, extractPower(effortsMap, 600));
            best20min = Math.max(best20min, extractPower(effortsMap, 1200));
            best30min = Math.max(best30min, extractPower(effortsMap, 1800));
            best60min = Math.max(best60min, extractPower(effortsMap, 3600));
        }

        List<Double> estimates = new ArrayList<>();

        // Longer durations are more reliable — add them first.
        if (best60min > 0) estimates.add(best60min * FACTOR_FROM_60MIN);
        if (best30min > 0) estimates.add(best30min * FACTOR_FROM_30MIN);
        if (best20min > 0) estimates.add(best20min * FACTOR_FROM_20MIN);

        // 2-parameter Critical Power model via linear regression (most physiologically robust).
        double cpEstimate = estimateViaCriticalPower(best5min, best10min, best20min, best30min);
        if (cpEstimate > 0) estimates.add(cpEstimate);

        if (estimates.isEmpty()) return 0;

        double estimatedFtp = median(estimates);
        log.info("Estimated FTP: {}W (estimates={}, 20-min best: {}W, 30-min best: {}W, 60-min best: {}W)",
                Math.round(estimatedFtp),
                estimates.stream().map(e -> String.format("%.0f", e)).collect(Collectors.joining(",")),
                Math.round(best20min), Math.round(best30min), Math.round(best60min));
        return estimatedFtp;
    }

    /**
     * Extract best-effort power for a given duration (seconds) from the power curve map.
     * Handles both String and Integer keys (depends on JSON serialisation round-trip).
     */
    private double extractPower(Map<?, ?> effortsMap, int durationSeconds) {
        Object val = effortsMap.get(String.valueOf(durationSeconds));
        if (val == null) val = effortsMap.get(durationSeconds);
        if (val == null) return 0;
        try {
            double power = Double.parseDouble(String.valueOf(val));
            return power > 0 ? power : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * 2-parameter Critical Power model: P(t) = W'/t + CP
     * Linear form: E(t) = P(t) × t = CP × t + W'
     * Fit via ordinary least-squares regression on (t, E) pairs.
     * CP (slope) is the asymptote of the power-duration curve ≈ FTP.
     *
     * Uses efforts in the 5–30 min range where the hyperbolic model is most accurate.
     */
    private double estimateViaCriticalPower(double best5min, double best10min,
                                            double best20min, double best30min) {
        List<double[]> points = new ArrayList<>();
        if (best5min  > 0) points.add(new double[]{300,  best5min  * 300});
        if (best10min > 0) points.add(new double[]{600,  best10min * 600});
        if (best20min > 0) points.add(new double[]{1200, best20min * 1200});
        if (best30min > 0) points.add(new double[]{1800, best30min * 1800});

        if (points.size() < 2) return 0;

        double n     = points.size();
        double sumT  = 0, sumE  = 0, sumT2 = 0, sumTE = 0;
        for (double[] p : points) {
            sumT  += p[0];
            sumE  += p[1];
            sumT2 += p[0] * p[0];
            sumTE += p[0] * p[1];
        }

        double denom = n * sumT2 - sumT * sumT;
        if (Math.abs(denom) < 1e-9) return 0;

        double cp = (n * sumTE - sumT * sumE) / denom;
        return cp > 0 ? cp : 0;
    }

    /** Returns the median value of a list. Returns 0 for an empty list. */
    private double median(List<Double> values) {
        if (values.isEmpty()) return 0;
        List<Double> sorted = values.stream().sorted().collect(Collectors.toList());
        int mid = sorted.size() / 2;
        return sorted.size() % 2 == 0
                ? (sorted.get(mid - 1) + sorted.get(mid)) / 2.0
                : sorted.get(mid);
    }

    private void saveDailyTss(List<DailyTrainingLoad> loads) {
        for (DailyTrainingLoad load : loads) {
            dailyMetricRepository.save(load.getDate(), MetricResult.numeric("daily_tss", load.getTss()));
        }
    }

    private void savePmc(List<DailyTrainingLoad> loads) {
        List<CtlAtlTsbCalculator.PmcDataPoint> points = ctlAtlTsbCalculator.calculate(loads, null);
        for (CtlAtlTsbCalculator.PmcDataPoint point : points) {
            dailyMetricRepository.saveAll(point.getDate(), List.of(
                    MetricResult.numeric("ctl", point.getCtl()),
                    MetricResult.numeric("atl", point.getAtl()),
                    MetricResult.numeric("tsb", point.getTsb()),
                    MetricResult.numeric("readiness", calculateReadiness(point.getCtl(), point.getAtl(), point.getTsb()))
            ));
        }
    }

    private void saveTrainingMonotony(List<DailyTrainingLoad> loads, AthleteProfile profile) {
        for (int index = 0; index < loads.size(); index++) {
            int start = Math.max(0, index - 6);
            List<DailyTrainingLoad> window = loads.subList(start, index + 1);
            TrainingMonotonyCalculator.MonotonyStrain result = trainingMonotonyCalculator.calculate(window, profile);
            LocalDate date = loads.get(index).getDate();
            double monotony = Double.isFinite(result.getMonotony()) ? result.getMonotony() : 0.0;
            dailyMetricRepository.saveAll(date, List.of(
                    MetricResult.numeric("training_monotony", monotony),
                    MetricResult.numeric("training_strain", result.getStrain()),
                    MetricResult.numeric("training_monotony_warning", result.isWarning() ? 1 : 0)
            ));
        }
    }

    private void saveFtp(double effectiveFtp) {
        if (effectiveFtp > 0) {
            dailyMetricRepository.save(LocalDate.now(ZoneOffset.UTC), MetricResult.numeric("ftp", effectiveFtp));
        }
    }

    /**
     * Backfill FTP history by recomputing FTP at each unique activity date.
     * For each date D, FTP is estimated from all activities on or before D.
     * This gives a meaningful trend line in the FTP chart instead of a flat line.
     */
    public void backfillFtpHistory(List<Activity> allActivities, double profileFtpFloor) {
        // Collect unique dates (one per calendar day), sorted ascending
        List<LocalDate> activityDates = allActivities.stream()
                .filter(a -> a.getStartedAt() != null)
                .map(a -> a.getStartedAt().toLocalDate())
                .distinct()
                .sorted()
                .toList();

        if (activityDates.isEmpty()) return;

        // For efficiency: sort activities by date and process incrementally
        List<Activity> sorted = allActivities.stream()
                .filter(a -> a.getStartedAt() != null)
                .sorted(Comparator.comparing(a -> a.getStartedAt().toLocalDate()))
                .toList();

        double prev = 0;
        int actIdx = 0;
        double best5min = 0, best10min = 0, best20min = 0, best30min = 0, best60min = 0;

        for (LocalDate date : activityDates) {
            // Accumulate activities up to and including this date
            while (actIdx < sorted.size()
                    && !sorted.get(actIdx).getStartedAt().toLocalDate().isAfter(date)) {
                Activity a = sorted.get(actIdx++);
                Optional<Map<String, Object>> curveOpt =
                        activityMetricRepository.findJsonValue(a.getId(), POWER_CURVE_METRIC);
                if (curveOpt.isPresent()) {
                    Object effortsObj = curveOpt.get().get("efforts");
                    if (effortsObj instanceof Map<?, ?> effortsMap) {
                        best5min  = Math.max(best5min,  extractPower(effortsMap, 300));
                        best10min = Math.max(best10min, extractPower(effortsMap, 600));
                        best20min = Math.max(best20min, extractPower(effortsMap, 1200));
                        best30min = Math.max(best30min, extractPower(effortsMap, 1800));
                        best60min = Math.max(best60min, extractPower(effortsMap, 3600));
                    }
                }
            }

            List<Double> estimates = new ArrayList<>();
            if (best60min > 0) estimates.add(best60min * FACTOR_FROM_60MIN);
            if (best30min > 0) estimates.add(best30min * FACTOR_FROM_30MIN);
            if (best20min > 0) estimates.add(best20min * FACTOR_FROM_20MIN);
            double cp = estimateViaCriticalPower(best5min, best10min, best20min, best30min);
            if (cp > 0) estimates.add(cp);

            if (!estimates.isEmpty()) {
                double ftp = Math.max(median(estimates), profileFtpFloor);
                if (ftp != prev) {
                    dailyMetricRepository.save(date, MetricResult.numeric("ftp", ftp));
                    prev = ftp;
                }
            }
        }
        // Always write today's value
        if (prev > 0) {
            dailyMetricRepository.save(LocalDate.now(ZoneOffset.UTC), MetricResult.numeric("ftp", prev));
        }
    }

    private double calculateReadiness(double ctl, double atl, double tsb) {
        double tsbScore = Math.max(0, Math.min(60, (tsb + 30) * 2));
        double fitnessBonus = Math.min(25, ctl * 0.5);
        double fatiguePenalty = 0;
        if (ctl > 0 && atl > ctl * 1.3) {
            fatiguePenalty = Math.min(15, (atl - ctl) * 0.5);
        }
        return Math.max(0, Math.min(100, tsbScore + fitnessBonus - fatiguePenalty));
    }
}