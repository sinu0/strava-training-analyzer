package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.strava.analizator.application.SyncService;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayDto {

    private LocalDate asOf;
    private String dataStatus;
    private RecommendationDto recommendation;
    private List<EvidenceDto> evidence;
    private ConfidenceDto confidence;
    private ActivitySummaryDto lastActivity;
    private LoadSnapshotDto load;
    private TrainingPlanDto nextTraining;
    private SyncService.SyncStatus sync;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDto {
        private String decision;
        private String sessionType;
        private Integer durationMinutes;
        private BigDecimal targetTss;
        private String description;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvidenceDto {
        private String code;
        private String message;
        private String source;
        private LocalDate asOf;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfidenceDto {
        private String level;
        private List<String> reasons;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoadSnapshotDto {
        private BigDecimal ctl42;
        private BigDecimal atl7;
        private BigDecimal form;
        private LocalDate asOf;
    }
}
