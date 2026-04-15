package pl.strava.analizator.domain.vo;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ActivityFilter(
    String sportType,
    OffsetDateTime from,
    OffsetDateTime to,
    BigDecimal minDistanceM,
    BigDecimal maxDistanceM,
    Integer minMovingTimeSec,
    Integer maxMovingTimeSec,
    Short minAvgPowerW,
    Short maxAvgPowerW,
    Short minAvgHr,
    Short maxAvgHr,
    int page,
    int size
) {}
