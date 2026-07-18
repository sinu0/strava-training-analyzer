package pl.strava.analizator.infrastructure.persistence.jpa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

public interface ActivityCoreProjection {

    UUID getId();
    String getExternalId();
    String getSource();
    String getSportType();
    String getName();
    String getDescription();
    OffsetDateTime getStartedAt();
    Integer getElapsedTimeSec();
    Integer getMovingTimeSec();
    BigDecimal getDistanceM();
    BigDecimal getElevationGainM();
    BigDecimal getElevationLossM();
    BigDecimal getAvgSpeedMs();
    BigDecimal getMaxSpeedMs();
    Short getAvgHeartrate();
    Short getMaxHeartrate();
    Short getAvgPowerW();
    Short getMaxPowerW();
    Short getAvgCadence();
    Short getMaxCadence();
    Integer getCalories();
    BigDecimal getAvgTempC();
    String getSummaryPolyline();
    Instant getCreatedAt();
    Instant getUpdatedAt();
}
