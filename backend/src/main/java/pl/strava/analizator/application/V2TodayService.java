package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.ActivityDataQualityDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.TodayDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;

@Service
@RequiredArgsConstructor
public class V2TodayService {

    private final CoachService coachService;
    private final V2ActivityService activityService;
    private final AnalyticsService analyticsService;
    private final TrainingPlanService trainingPlanService;
    private final SyncService syncService;
    private final ActivityDataQualityService dataQualityService;

    public TodayDto getToday() {
        LocalDate today = LocalDate.now();
        List<TodayDto.EvidenceDto> evidence = new ArrayList<>();
        List<String> confidenceReasons = new ArrayList<>();

        ActivitySummaryDto lastActivity = findLastActivity();
        if (lastActivity != null) {
            evidence.add(TodayDto.EvidenceDto.builder()
                    .code("LAST_ACTIVITY")
                    .message(lastActivity.getName() != null ? lastActivity.getName() : "Ostatni trening")
                    .source("activities")
                    .asOf(lastActivity.getStartedAt().toLocalDate())
                    .build());
        }
        ActivityDataQualityDto latestQuality = findQuality(lastActivity, evidence);

        TodayDto.LoadSnapshotDto load = findLoad(today);
        if (load != null) {
            evidence.add(TodayDto.EvidenceDto.builder()
                    .code("TRAINING_LOAD")
                    .message("Obciążenie 7/42 dni jest dostępne")
                    .source("daily_metrics")
                    .asOf(load.getAsOf())
                    .build());
        }

        TodayDto.RecommendationDto recommendation = findRecommendation(evidence, today);
        TrainingPlanDto nextTraining = trainingPlanService.getPlans(today, today.plusDays(14)).stream()
                .filter(plan -> plan.getActualActivityId() == null)
                .min(Comparator.comparing(TrainingPlanDto::getDate))
                .orElse(null);

        SyncService.SyncStatus sync = syncService.getLastSyncStatus();
        String dataStatus = dataStatus(lastActivity, latestQuality, load, sync, recommendation);
        String confidenceLevel = confidenceLevel(
                lastActivity, latestQuality, load, recommendation, confidenceReasons);

        return TodayDto.builder()
                .asOf(today)
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
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
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
                    .asOf(activity.getStartedAt().toLocalDate())
                    .build());
            return quality;
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private TodayDto.LoadSnapshotDto findLoad(LocalDate today) {
        List<PmcDataDto> points = analyticsService.getPmc(today.minusDays(1), today);
        if (points.isEmpty()) return null;
        PmcDataDto latest = points.get(points.size() - 1);
        boolean unavailable = isZero(latest.getCtl()) && isZero(latest.getAtl()) && isZero(latest.getTsb());
        if (unavailable) return null;
        return TodayDto.LoadSnapshotDto.builder()
                .ctl42(latest.getCtl())
                .atl7(latest.getAtl())
                .form(latest.getTsb())
                .asOf(latest.getDate())
                .build();
    }

    private TodayDto.RecommendationDto findRecommendation(List<TodayDto.EvidenceDto> evidence, LocalDate today) {
        try {
            AdaptiveCoachResponse response = coachService.getTodayDecision();
            if (response.getReasoning() != null) {
                response.getReasoning().stream().limit(3).forEach(reason -> evidence.add(
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
                    .sessionType(session != null ? session.getType() : null)
                    .durationMinutes(session != null ? session.getDurationMinutes() : null)
                    .targetTss(session != null ? BigDecimal.valueOf(session.getTargetTss()) : null)
                    .description(session != null ? session.getDescription() : response.getInsight())
                    .build();
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String dataStatus(ActivitySummaryDto lastActivity, ActivityDataQualityDto quality,
                              TodayDto.LoadSnapshotDto load,
                              SyncService.SyncStatus sync, TodayDto.RecommendationDto recommendation) {
        if (lastActivity == null) return "UNKNOWN";
        if (quality == null || !"AVAILABLE".equals(quality.getStatus())
                || load == null || recommendation == null || "failed".equals(sync.status())
                || "rate_limited".equals(sync.status())) return "PARTIAL";
        return "AVAILABLE";
    }

    private String confidenceLevel(ActivitySummaryDto lastActivity, ActivityDataQualityDto quality,
                                   TodayDto.LoadSnapshotDto load,
                                   TodayDto.RecommendationDto recommendation, List<String> reasons) {
        if (lastActivity == null) reasons.add("Brak aktywności do porównania");
        if (quality == null) reasons.add("Brak oceny jakości ostatniej aktywności");
        else if (!"AVAILABLE".equals(quality.getStatus())) {
            reasons.add("Jakość ostatniej aktywności: " + quality.getStatus());
        }
        if (load == null) reasons.add("Brak wiarygodnej historii obciążenia");
        if (recommendation == null) reasons.add("Rekomendacja nie jest dostępna");
        if (lastActivity != null && quality != null && "AVAILABLE".equals(quality.getStatus())
                && load != null && recommendation != null) {
            reasons.add("Aktywność, jej jakość, obciążenie i rekomendacja mają aktualne źródła");
            return "HIGH";
        }
        return lastActivity != null && (quality != null || load != null || recommendation != null)
                ? "MEDIUM" : "LOW";
    }

    private boolean isZero(BigDecimal value) {
        return value == null || value.compareTo(BigDecimal.ZERO) == 0;
    }
}
