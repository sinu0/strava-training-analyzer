package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.ActivityDataQualityDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.TodayDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
public class V2TodayService {

    private final java.time.Clock clock;

    private final CoachService coachService;
    private final V2ActivityService activityService;
    private final TrainingLoadService trainingLoadService;
    private final TrainingPlanService trainingPlanService;
    private final SyncService syncService;
    private final ActivityDataQualityService dataQualityService;
    private final AthleteProfileRepository athleteProfileRepository;
    private final HealthService healthService;

    public TodayDto getToday() {
        LocalDate today = LocalDate.now(clock);
        List<TodayDto.EvidenceDto> evidence = new ArrayList<>();
        List<String> confidenceReasons = new ArrayList<>();

        ActivitySummaryDto lastActivity = findLastActivity();
        if (lastActivity != null) {
            evidence.add(TodayDto.EvidenceDto.builder()
                    .code("LAST_ACTIVITY")
                    .message(lastActivity.getName() != null ? lastActivity.getName() : "Ostatni trening")
                    .source("activities")
                    .asOf(lastActivity.getStartedAt().atZoneSameInstant(clock.getZone()).toLocalDate())
                    .build());
        }
        ActivityDataQualityDto latestQuality = findQuality(lastActivity, evidence);

        var loadAnalytics = trainingLoadService.getLoad(today.minusDays(41), today);
        TodayDto.LoadSnapshotDto load = findLoad(loadAnalytics, today);
        BigDecimal loadCoverage = loadAnalytics.getCoverage();
        if (load != null) {
            evidence.add(TodayDto.EvidenceDto.builder()
                    .code("TRAINING_LOAD")
                    .message("Obciążenie 7/42 dni: " + loadAnalytics.getAvailability())
                    .source("daily_metrics")
                    .asOf(load.getAsOf())
                    .build());
        }

        TodayDto.RecommendationDto recommendation = findRecommendation(evidence, today);
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        boolean profileReady = profile != null && profile.hasFtp()
                && (profile.hasLthr() || (profile.getMaxHrBpm() != null && profile.getMaxHrBpm() > 0));
        HealthService.RecoveryStatus health = findHealth(today);
        boolean healthAvailable = health != null && "AVAILABLE".equals(health.availability());
        if (profileReady) {
            evidence.add(TodayDto.EvidenceDto.builder().code("ATHLETE_PROFILE")
                    .message("Profil zawiera FTP i próg tętna")
                    .source("athlete_profile").asOf(today).build());
        }
        if (healthAvailable) {
            evidence.add(TodayDto.EvidenceDto.builder().code("HEALTH_RECOVERY")
                    .message("Dane regeneracji są dostępne")
                    .source("daily_summaries").asOf(today).build());
        }
        TrainingPlanDto nextTraining = trainingPlanService.getPlans(today, today.plusDays(14)).stream()
                .filter(plan -> plan.getActualActivityId() == null && ("PLANNED".equals(plan.getStatus()) || "PARTIAL".equals(plan.getStatus())))
                .min(Comparator.comparing(TrainingPlanDto::getDate))
                .orElse(null);

        SyncService.SyncStatus sync = syncService.getLastSyncStatus();
        String dataStatus = dataStatus(lastActivity, latestQuality, load, loadCoverage,
                profileReady, healthAvailable, sync, recommendation);
        String confidenceLevel = confidenceLevel(
                lastActivity, latestQuality, load, loadCoverage, profileReady,
                healthAvailable, recommendation, confidenceReasons);
        if (recommendation != null && "LOW".equals(recommendation.getConfidence())) {
            confidenceLevel = "LOW";
            confidenceReasons.add(recommendation.getDescription());
        } else if (recommendation != null && "MEDIUM".equals(recommendation.getConfidence()) && "HIGH".equals(confidenceLevel)) {
            confidenceLevel = "MEDIUM";
        }

        return TodayDto.builder()
                .asOf(today)
                .timezone(clock.getZone().getId())
                .dataStatus(dataStatus)
                .recommendation(recommendation)
                .evidence(evidence)
                .confidence(TodayDto.ConfidenceDto.builder()
                        .level(confidenceLevel)
                        .reasons(confidenceReasons)
                        .build())
                .lastActivity(lastActivity)
                .load(load)
                .nextTraining(nextTraining)
                .sync(sync)
                .build();
    }

    private ActivitySummaryDto findLastActivity() {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return activityService.findActivities(null, null, now, 0, 1).getItems().stream()
                .findFirst().orElse(null);
    }

    private ActivityDataQualityDto findQuality(ActivitySummaryDto activity, List<TodayDto.EvidenceDto> evidence) {
        if (activity == null) return null;
        try {
            ActivityDataQualityDto quality = dataQualityService.get(activity.getId());
            evidence.add(TodayDto.EvidenceDto.builder()
                    .code("DATA_QUALITY")
                    .message("Jakość ostatniej aktywności: " + quality.getStatus())
                    .source("data_quality")
                    .asOf(activity.getStartedAt().atZoneSameInstant(clock.getZone()).toLocalDate())
                    .build());
            return quality;
        } catch (RuntimeException exception) {
            log.warn("Today section unavailable", exception);
            return null;
        }
    }

    private TodayDto.LoadSnapshotDto findLoad(pl.strava.analizator.application.dto.LoadAnalyticsDto load, LocalDate today) {
        PmcDataDto latest = load.getPoints().stream().filter(TrainingLoadService::complete)
                .filter(point -> !point.getDate().isBefore(today.minusDays(1))).reduce((a, b) -> b).orElse(null);
        if (latest == null) return null;
        return TodayDto.LoadSnapshotDto.builder().ctl42(latest.getCtl()).atl7(latest.getAtl()).form(latest.getTsb())
                .asOf(latest.getDate()).availability(load.getAvailability()).coverage(load.getCoverage())
                .temporalCoverage(load.getTemporalCoverage()).build();
    }

    private HealthService.RecoveryStatus findHealth(LocalDate today) {
        try {
            return healthService.getRecoveryStatus(today);
        } catch (RuntimeException exception) {
            log.warn("Today section unavailable", exception);
            return null;
        }
    }

    private TodayDto.RecommendationDto findRecommendation(List<TodayDto.EvidenceDto> evidence, LocalDate today) {
        try {
            AdaptiveCoachResponse response = coachService.getTodayDecision();
            if (response.getReasoning() != null) {
                response.getReasoning().stream().forEach(reason -> evidence.add(
                        TodayDto.EvidenceDto.builder()
                                .code("COACH_REASON")
                                .message(reason)
                                .source("coach")
                                .asOf(today)
                                .build()));
            }
            AdaptiveCoachResponse.SessionOptionDto session = response.getBestSession();
            return TodayDto.RecommendationDto.builder()
                    .decision(response.getDecision())
                    .confidence(response.getConfidence()).algorithmVersion(response.getAlgorithmVersion())
                    .sessionType(session != null ? session.getType() : null)
                    .durationMinutes(session != null ? session.getDurationMinutes() : null)
                    .targetTss(session != null && session.getTargetTss() != null ? BigDecimal.valueOf(session.getTargetTss()) : null)
                    .description(session != null ? session.getDescription() : response.getInsight())
                    .build();
        } catch (RuntimeException exception) {
            log.warn("Today section unavailable", exception);
            return null;
        }
    }

    private String dataStatus(ActivitySummaryDto lastActivity, ActivityDataQualityDto quality,
                              TodayDto.LoadSnapshotDto load, BigDecimal loadCoverage,
                              boolean profileReady, boolean healthAvailable,
                              SyncService.SyncStatus sync, TodayDto.RecommendationDto recommendation) {
        if (lastActivity == null) return "UNKNOWN";
        if (quality == null || !"AVAILABLE".equals(quality.getStatus())
                || load == null || !"AVAILABLE".equals(load.getAvailability()) || !reliableCoverage(loadCoverage) || !profileReady || !healthAvailable
                || recommendation == null || "LOW".equals(recommendation.getConfidence()) || "failed".equals(sync.status())
                || "rate_limited".equals(sync.status())) return "PARTIAL";
        return "AVAILABLE";
    }

    private String confidenceLevel(ActivitySummaryDto lastActivity, ActivityDataQualityDto quality,
                                   TodayDto.LoadSnapshotDto load, BigDecimal loadCoverage,
                                   boolean profileReady, boolean healthAvailable,
                                   TodayDto.RecommendationDto recommendation, List<String> reasons) {
        if (lastActivity == null) reasons.add("Brak aktywności do porównania");
        if (quality == null) reasons.add("Brak oceny jakości ostatniej aktywności");
        else if (!"AVAILABLE".equals(quality.getStatus())) {
            reasons.add("Jakość ostatniej aktywności: " + quality.getStatus());
        }
        if (load == null) reasons.add("Brak wiarygodnej historii obciążenia");
        else if (!"AVAILABLE".equals(load.getAvailability())) reasons.add("Historia obciążenia jest niepełna.");
        if (loadCoverage == null) reasons.add("Brak informacji o pokryciu obciążenia aktywności");
        else if (!reliableCoverage(loadCoverage)) {
            reasons.add("Obciążenie rozpoznane dla " + loadCoverage.multiply(BigDecimal.valueOf(100))
                    .setScale(0, java.math.RoundingMode.HALF_UP) + "% aktywności");
        }
        if (!profileReady) reasons.add("Profil wymaga FTP oraz LTHR lub tętna maksymalnego");
        if (!healthAvailable) reasons.add("Brak pełnych danych zdrowotnych i regeneracyjnych");
        if (recommendation == null) reasons.add("Rekomendacja nie jest dostępna");
        if (lastActivity != null && quality != null && "AVAILABLE".equals(quality.getStatus())
                && load != null && "AVAILABLE".equals(load.getAvailability()) && reliableCoverage(loadCoverage) && profileReady && healthAvailable
                && recommendation != null) {
            reasons.add("Aktywność, obciążenie, profil, regeneracja i rekomendacja mają aktualne źródła");
            return "HIGH";
        }
        return lastActivity != null && (quality != null || load != null || recommendation != null)
                ? "MEDIUM" : "LOW";
    }

    private boolean reliableCoverage(BigDecimal coverage) {
        return coverage != null && coverage.compareTo(BigDecimal.valueOf(0.8)) >= 0;
    }

    private boolean isZero(BigDecimal value) {
        return value == null || value.compareTo(BigDecimal.ZERO) == 0;
    }
}
