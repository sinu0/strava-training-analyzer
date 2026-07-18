package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ActivityCoreView {

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
    private Instant createdAt;
    private Instant updatedAt;
}
