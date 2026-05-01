package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.CurrentPerformanceStateDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.PerformanceIndicatorsDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.RecentTrendsDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.RecentWorkoutDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.RecoverySignalsDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.TrainingLoadStateDto;
import pl.strava.analizator.application.dto.PerformancePredictionResponse;
import pl.strava.analizator.application.dto.PerformancePredictionResponse.PeakWindowDto;
import pl.strava.analizator.application.dto.PerformancePredictionResponse.PerformanceDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.vo.DateRange;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PerformancePredictionService {

    private final DailyMetricRepository dailyMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final DailySummaryRepository dailySummaryRepository;
    private final ActivityRepository activityRepository;

    private static final double TSB_PEAK_MIN = 0.0;
    private static final double TSB_PEAK_MAX = 18.0;
    private static final double ATL_CTL_RATIO_PEAK = 1.10;
    private static final double ATL_CTL_RATIO_FATIGUE = 1.30;
    private static final double CTL_HIGH_THRESHOLD = 70.0;
    private static final double CTL_LOW_THRESHOLD = 40.0;
    private static final double TSB_FATIGUE = -12.0;
    private static final double TSB_SEVERE_FATIGUE = -20.0;
    private static final double ATL_DECAY_TIME_CONSTANT = 7.0;
    private static final double ATL_CTL_OPTIMAL_MAX = 1.15;
    private static final double ATL_CTL_OPTIMAL_MIN = 0.80;

    public PerformancePredictionResponse predict(PerformancePredictionRequest request) {
        TrainingLoadStateDto load = request.getTrainingLoad();
        RecentTrendsDto trends = request.getRecentTrends();
        PerformanceIndicatorsDto perf = request.getPerformanceIndicators();
        RecoverySignalsDto recovery = request.getRecoverySignals();
        List<RecentWorkoutDto> recentWorkouts = request.getRecentWorkouts();

        double ctl = toDouble(load != null ? load.getCtl() : null);
        double atl = toDouble(load != null ? load.getAtl() : null);
        double tsb = toDouble(load != null ? load.getTsb() : null);
        double atlCtlRatio = ctl > 0 ? atl / ctl : 1.0;

        String ctlTrend = trends != null ? safeString(trends.getCtlTrend()) : "STABLE";
        String fatigueTrend = trends != null ? safeString(trends.getFatigueTrend()) : "STABLE";

        int ftp = perf != null && perf.getFtp() != null ? perf.getFtp().intValue() : 250;
        String ftpTrend = perf != null ? safeString(perf.getFtpTrend()) : "STABLE";
        int tte = perf != null && perf.getTte() != null ? perf.getTte() : 45;

        String hrvTrend = recovery != null ? safeString(recovery.getHrvTrend()) : "STABLE";
        String rhrTrend = recovery != null ? safeString(recovery.getRestingHrTrend()) : "STABLE";
        String sleepQuality = recovery != null ? safeString(recovery.getSleepQuality()) : "AVERAGE";

        String formState = classifyForm(ctl, atl, tsb, atlCtlRatio, ctlTrend, fatigueTrend, hrvTrend, rhrTrend);
        int readinessScore = calculateReadiness(tsb, atlCtlRatio, fatigueTrend, hrvTrend, rhrTrend,
                sleepQuality, recentWorkouts);
        PeakWindowDto peakWindow = predictPeakWindow(ctl, atl, tsb, atlCtlRatio, fatigueTrend, ctlTrend);
        PerformanceDto performance = predictPerformance(ctl, tsb, ftp, ftpTrend, tte, formState, atlCtlRatio);
        List<String> recommendations = generateRecommendations(formState, tsb, atlCtlRatio, ctl,
                fatigueTrend, hrvTrend);
        int confidence = calculateConfidence(request);

        return PerformancePredictionResponse.builder()
                .formState(formState)
                .readinessScore(readinessScore)
                .peakWindow(peakWindow)
                .performancePrediction(performance)
                .recommendations(recommendations)
                .confidence(confidence)
                .build();
    }

    // ---- FORM CLASSIFICATION ----

    String classifyForm(double ctl, double atl, double tsb, double atlCtlRatio,
            String ctlTrend, String fatigueTrend, String hrvTrend, String rhrTrend) {

        boolean ctlHigh = ctl >= CTL_HIGH_THRESHOLD;
        boolean tsbInPeakRange = tsb >= TSB_PEAK_MIN && tsb <= TSB_PEAK_MAX;
        boolean fatigueLow = atlCtlRatio <= ATL_CTL_RATIO_PEAK;

        if (ctlHigh && tsbInPeakRange && fatigueLow && !"UP".equals(fatigueTrend)) {
            return "PEAK";
        }

        boolean ctlLow = ctl < CTL_LOW_THRESHOLD;
        if (ctlLow && "DOWN".equals(ctlTrend)) {
            return "DETRAINED";
        }

        boolean highFatigue = atlCtlRatio > ATL_CTL_RATIO_FATIGUE
                || tsb < TSB_FATIGUE
                || "UP".equals(fatigueTrend);
        boolean recoveryStrained = "DOWN".equals(hrvTrend)
                || "UP".equals(rhrTrend);

        if (highFatigue && recoveryStrained) {
            return "FATIGUED";
        }
        if (tsb < TSB_SEVERE_FATIGUE) {
            return "FATIGUED";
        }
        if (atlCtlRatio > ATL_CTL_RATIO_FATIGUE) {
            return "FATIGUED";
        }

        if ("UP".equals(ctlTrend) || (ctl >= CTL_HIGH_THRESHOLD && !"DOWN".equals(ctlTrend))) {
            return "BUILDING";
        }
        if (ctl > CTL_LOW_THRESHOLD && !"DOWN".equals(ctlTrend)) {
            return "BUILDING";
        }

        return "BUILDING";
    }

    // ---- READINESS SCORE ----

    int calculateReadiness(double tsb, double atlCtlRatio, String fatigueTrend,
            String hrvTrend, String rhrTrend, String sleepQuality,
            List<RecentWorkoutDto> recentWorkouts) {
        int score = 50;

        // TSB component: -25 to +25
        double tsbClamped = Math.max(-25, Math.min(25, tsb));
        score += (int) Math.round(tsbClamped);

        // ATL/CTL ratio component
        if (atlCtlRatio > 1.50) score -= 25;
        else if (atlCtlRatio > 1.30) score -= 15;
        else if (atlCtlRatio > 1.15) score -= 5;
        else if (atlCtlRatio < 0.70) score -= 5;
        else if (atlCtlRatio < 0.85) score += 5;

        // Fatigue trend
        if ("DOWN".equals(fatigueTrend)) score += 10;
        else if ("UP".equals(fatigueTrend)) score -= 15;

        // HRV
        if ("UP".equals(hrvTrend)) score += 8;
        else if ("DOWN".equals(hrvTrend)) score -= 12;

        // Resting HR
        if ("DOWN".equals(rhrTrend)) score += 5;
        else if ("UP".equals(rhrTrend)) score -= 8;

        // Sleep
        switch (sleepQuality) {
            case "GOOD": score += 7; break;
            case "POOR": score -= 10; break;
            default: break;
        }

        // Recent workouts
        if (recentWorkouts != null && !recentWorkouts.isEmpty()) {
            long overachieves = recentWorkouts.stream()
                    .filter(r -> "OVERACHIEVE".equalsIgnoreCase(r.getOutcome())).count();
            long successes = recentWorkouts.stream()
                    .filter(r -> "SUCCESS".equalsIgnoreCase(r.getOutcome())).count();
            long fails = recentWorkouts.stream()
                    .filter(r -> "FAIL".equalsIgnoreCase(r.getOutcome())).count();

            if (overachieves >= 2) score += 5;
            if (fails >= 2) score -= 10;
            if (successes == recentWorkouts.size() && !recentWorkouts.isEmpty()) score += 3;
        }

        return Math.max(0, Math.min(100, score));
    }

    // ---- PEAK WINDOW PREDICTION ----

    PeakWindowDto predictPeakWindow(double ctl, double atl, double tsb, double atlCtlRatio,
            String fatigueTrend, String ctlTrend) {

        int startInDays;
        int durationDays;

        if (tsb >= TSB_PEAK_MIN && tsb <= 12 && atlCtlRatio <= ATL_CTL_RATIO_PEAK) {
            startInDays = 1;
            durationDays = estimateDuration(tsb, atlCtlRatio, 7);
        } else if (tsb >= -5 && atlCtlRatio <= ATL_CTL_OPTIMAL_MAX) {
            startInDays = 2;
            durationDays = estimateDuration(tsb, atlCtlRatio, 5);
        } else if (tsb >= -15 && "DOWN".equals(fatigueTrend)) {
            double daysUntilPositive = Math.ceil(Math.abs(tsb) / 3.0);
            startInDays = (int) daysUntilPositive + 1;
            durationDays = estimateDuration(tsb, atlCtlRatio, 4);
        } else if (tsb >= -25) {
            double daysToRecover = estimateRecoveryDays(atlCtlRatio, tsb);
            startInDays = Math.max(5, (int) Math.ceil(daysToRecover));
            durationDays = estimateDuration(tsb, atlCtlRatio, 3);
        } else {
            double daysToRecover = estimateRecoveryDays(atlCtlRatio, tsb);
            startInDays = Math.max(7, (int) Math.ceil(daysToRecover));
            durationDays = 2;
        }

        if ("DOWN".equals(ctlTrend) && ctl < CTL_HIGH_THRESHOLD) {
            startInDays = Math.max(7, startInDays + 3);
            durationDays = Math.max(1, durationDays - 1);
        }

        return PeakWindowDto.builder()
                .startInDays(Math.min(10, startInDays))
                .durationDays(Math.max(1, Math.min(7, durationDays)))
                .build();
    }

    private double estimateRecoveryDays(double atlCtlRatio, double tsb) {
        double excessFatigue = Math.max(0, atlCtlRatio - 1.0) * 10;
        double deepNegativeTsb = Math.max(0, Math.abs(Math.min(0, tsb))) / 3.0;
        return excessFatigue + deepNegativeTsb;
    }

    private int estimateDuration(double tsb, double atlCtlRatio, int baseDays) {
        int extra = 0;
        if (tsb >= 5 && tsb <= 15) extra += 2;
        if (atlCtlRatio <= 0.9) extra += 1;
        return Math.min(7, baseDays + extra);
    }

    // ---- PERFORMANCE PREDICTION ----

    PerformanceDto predictPerformance(double ctl, double tsb, int currentFtp,
            String ftpTrend, int tte, String formState, double atlCtlRatio) {
        double multiplier = 1.0;

        // CTL effect
        if (ctl >= CTL_HIGH_THRESHOLD + 10) multiplier += 0.03;
        else if (ctl >= CTL_HIGH_THRESHOLD) multiplier += 0.01;
        else if (ctl < CTL_LOW_THRESHOLD) multiplier -= 0.03;

        // TSB effect
        if (tsb >= 10) multiplier += 0.02;
        else if (tsb >= 5) multiplier += 0.01;
        else if (tsb < TSB_FATIGUE) multiplier -= 0.05;
        else if (tsb < -5) multiplier -= 0.02;

        // Fatigue effect
        if (atlCtlRatio > ATL_CTL_RATIO_FATIGUE) multiplier -= 0.05;
        else if (atlCtlRatio <= ATL_CTL_RATIO_PEAK) multiplier += 0.01;

        // Form state effect
        switch (formState) {
            case "PEAK": multiplier += 0.03; break;
            case "FATIGUED": multiplier -= 0.05; break;
            case "DETRAINED": multiplier -= 0.02; break;
            default: break;
        }

        // FTP trend
        if ("UP".equals(ftpTrend)) multiplier += 0.02;
        else if ("DOWN".equals(ftpTrend)) multiplier -= 0.02;

        int predictedFtp = (int) Math.round(currentFtp * multiplier);
        int predicted20min = predictedFtp;

        return PerformanceDto.builder()
                .ftp(predictedFtp)
                .power20min(predicted20min)
                .build();
    }

    // ---- RECOMMENDATIONS ----

    List<String> generateRecommendations(String formState, double tsb, double atlCtlRatio,
            double ctl, String fatigueTrend, String hrvTrend) {
        List<String> recs = new ArrayList<>();

        switch (formState) {
            case "PEAK" -> {
                if (tsb > 15 && "DOWN".equals(fatigueTrend)) {
                    recs.add("Reduce volume by 30-40% while maintaining intensity to sharpen form.");
                    recs.add("Schedule key race/event within the 3-6 day peak window.");
                } else if (tsb > 5) {
                    recs.add("Reduce volume slightly while maintaining intensity for peak preservation.");
                } else {
                    recs.add("Consider a short taper: reduce volume, maintain intensity.");
                }
                recs.add("Focus on quality sessions: VO2max and threshold intervals.");
            }
            case "BUILDING" -> {
                recs.add("Continue progressive overload with adequate recovery days.");
                recs.add("Target CTL gain of 3-5 points per week through steady training.");
                if (ctl > CTL_HIGH_THRESHOLD) {
                    recs.add("Consider a scheduled rest week to consolidate fitness gains.");
                }
            }
            case "FATIGUED" -> {
                if (tsb < TSB_SEVERE_FATIGUE) {
                    recs.add("Prioritize rest and recovery immediately. Take 2-3 easy days.");
                } else {
                    recs.add("Reduce training load by 30-50% for 3-5 days to shed fatigue.");
                }
                recs.add("Focus on sleep quality (8+ hours) and nutrition to accelerate recovery.");
                if ("DOWN".equals(hrvTrend)) {
                    recs.add("HRV declining - your body is signaling deep fatigue. Prioritize passive recovery.");
                }
            }
            case "DETRAINED" -> {
                recs.add("Gradually increase training volume and frequency to rebuild CTL.");
                recs.add("Start with zone 2 endurance rides to re-establish aerobic base.");
                recs.add("Aim for consistency over intensity during the rebuilding phase.");
            }
        }

        // Additional based on ATL/CTL ratio
        if (atlCtlRatio > 1.40 && !"FATIGUED".equals(formState)) {
            recs.add("ATL/CTL ratio above 1.40 - fatigue accumulation is concerning. Consider an easy day.");
        }

        return recs;
    }

    // ---- CONFIDENCE ----

    int calculateConfidence(PerformancePredictionRequest request) {
        int confidence = 50;

        if (request.getTrainingLoad() != null) {
            TrainingLoadStateDto load = request.getTrainingLoad();
            if (load.getCtl() != null) confidence += 10;
            if (load.getAtl() != null) confidence += 8;
            if (load.getTsb() != null) confidence += 8;
        }

        if (request.getRecentTrends() != null) {
            RecentTrendsDto trends = request.getRecentTrends();
            if (trends.getCtlTrend() != null) confidence += 5;
            if (trends.getFatigueTrend() != null) confidence += 5;
        }

        if (request.getRecoverySignals() != null) {
            RecoverySignalsDto signals = request.getRecoverySignals();
            if (signals.getHrvTrend() != null) confidence += 4;
            if (signals.getRestingHrTrend() != null) confidence += 3;
            if (signals.getSleepQuality() != null) confidence += 3;
        }

        if (request.getPerformanceIndicators() != null) {
            PerformanceIndicatorsDto perf = request.getPerformanceIndicators();
            if (perf.getFtp() != null) confidence += 4;
        }

        return Math.min(100, confidence);
    }

    // ---- CURRENT STATE ----

    public CurrentPerformanceStateDto getCurrentState() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        BigDecimal ctl = dailyMetricRepository.findNumericValue(today, "ctl")
                .or(() -> dailyMetricRepository.findNumericValue(yesterday, "ctl"))
                .orElse(BigDecimal.ZERO);
        BigDecimal atl = dailyMetricRepository.findNumericValue(today, "atl")
                .or(() -> dailyMetricRepository.findNumericValue(yesterday, "atl"))
                .orElse(BigDecimal.ZERO);
        BigDecimal tsb = dailyMetricRepository.findNumericValue(today, "tsb")
                .or(() -> dailyMetricRepository.findNumericValue(yesterday, "tsb"))
                .orElse(BigDecimal.ZERO);

        String ctlTrend = computeCtlTrend();
        String fatigueTrend = computeFatigueTrend();

        BigDecimal ftp = resolveFtp();
        String ftpTrend = computeFtpTrend();

        String hrvTrend = computeHrvTrend();
        String restingHrTrend = computeRestingHrTrend();
        String sleepQuality = computeSleepQuality();

        return CurrentPerformanceStateDto.builder()
                .ctl(ctl)
                .atl(atl)
                .tsb(tsb)
                .ctlTrend(ctlTrend)
                .fatigueTrend(fatigueTrend)
                .ftp(ftp)
                .ftpTrend(ftpTrend)
                .hrvTrend(hrvTrend)
                .restingHrTrend(restingHrTrend)
                .sleepQuality(sleepQuality)
                .recentSuccessCount(0)
                .recentTotalCount(0)
                .build();
    }

    private String computeCtlTrend() {
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(
                "ctl", DateRange.lastDays(14));
        return computeTrend(series);
    }

    private String computeFatigueTrend() {
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(
                "atl", DateRange.lastDays(14));
        return computeTrend(series);
    }

    private String computeFtpTrend() {
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(
                "ftp", DateRange.lastDays(30));
        return computeTrend(series);
    }

    private String computeHrvTrend() {
        List<DailySummary> summaries = dailySummaryRepository.findByDateRange(
                DateRange.lastDays(14));
        if (summaries.size() < 3) return "STABLE";

        double recent = avgHrv(summaries.subList(
                Math.max(0, summaries.size() - 5), summaries.size()));
        double older = avgHrv(summaries.subList(0, Math.max(1, summaries.size() - 5)));
        if (older == 0) return "STABLE";

        double change = (recent - older) / older;
        if (change > 0.05) return "UP";
        if (change < -0.05) return "DOWN";
        return "STABLE";
    }

    private String computeRestingHrTrend() {
        List<DailySummary> summaries = dailySummaryRepository.findByDateRange(
                DateRange.lastDays(14));
        if (summaries.size() < 3) return "STABLE";

        double recent = avgRhr(summaries.subList(
                Math.max(0, summaries.size() - 5), summaries.size()));
        double older = avgRhr(summaries.subList(0, Math.max(1, summaries.size() - 5)));
        if (older == 0) return "STABLE";

        double change = (recent - older) / older;
        if (change > 0.03) return "UP";
        if (change < -0.03) return "DOWN";
        return "STABLE";
    }

    private String computeSleepQuality() {
        List<DailySummary> summaries = dailySummaryRepository.findByDateRange(
                DateRange.lastDays(7));
        if (summaries.isEmpty()) return "AVERAGE";

        double avg = summaries.stream()
                .filter(s -> s.getSleepScore() != null)
                .mapToInt(DailySummary::getSleepScore)
                .average()
                .orElse(50);

        if (avg >= 75) return "GOOD";
        if (avg < 50) return "POOR";
        return "AVERAGE";
    }

    private BigDecimal resolveFtp() {
        var profile = athleteProfileRepository.findFirst().orElse(null);
        if (profile != null && profile.getFtpWatts() != null && profile.getFtpWatts() > 0) {
            return BigDecimal.valueOf(profile.getFtpWatts());
        }
        LocalDate today = LocalDate.now();
        return dailyMetricRepository.findNumericValue(today, "ftp")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "ftp"))
                .orElse(BigDecimal.valueOf(250));
    }

    private String computeTrend(Map<LocalDate, BigDecimal> series) {
        if (series.size() < 2) return "STABLE";
        var entries = new ArrayList<>(series.entrySet());
        entries.sort(Map.Entry.comparingByKey());
        double first = entries.get(0).getValue().doubleValue();
        double last = entries.get(entries.size() - 1).getValue().doubleValue();
        if (first == 0) return "STABLE";
        double change = (last - first) / Math.abs(first);
        if (change > 0.03) return "UP";
        if (change < -0.03) return "DOWN";
        return "STABLE";
    }

    private double avgHrv(List<DailySummary> summaries) {
        return summaries.stream()
                .filter(s -> s.getHrvRmssd() != null)
                .mapToDouble(s -> s.getHrvRmssd().doubleValue())
                .average()
                .orElse(0);
    }

    private double avgRhr(List<DailySummary> summaries) {
        return summaries.stream()
                .filter(s -> s.getRestingHrBpm() != null)
                .mapToInt(DailySummary::getRestingHrBpm)
                .average()
                .orElse(0);
    }

    // ---- HELPERS ----

    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.0;
    }

    private String safeString(String value) {
        return value != null ? value : "STABLE";
    }
}
