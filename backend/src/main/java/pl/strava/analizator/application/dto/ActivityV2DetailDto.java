package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityV2DetailDto {

    private UUID id;
    private String externalId;
    private String source;
    private String sportType;
    private String name;
    private String description;
    private OffsetDateTime startedAt;
    private Integer elapsedTimeSec;
    private Integer movingTimeSec;
    private BigDecimal distanceM;
    private BigDecimal elevationGainM;
    private BigDecimal elevationLossM;
    private BigDecimal avgSpeedMs;
    private BigDecimal maxSpeedMs;
    private Short avgHeartrate;
    private Short maxHeartrate;
    private Short avgPowerW;
    private Short maxPowerW;
    private Short avgCadence;
    private Short maxCadence;
    private Integer calories;
    private BigDecimal avgTempC;
    private String summaryPolyline;
    private List<MetricValueDto> metrics;
    private ActivityTrainingEffectDto trainingEffect;
    private Instant createdAt;
    private Instant updatedAt;
}
