package pl.strava.analizator.domain.vo;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Value object representing a single lap within an activity.
 * Enriched with computed metrics for interval analysis.
 */
@Getter
@Builder
@AllArgsConstructor
public class Lap {
    private final String name;
    private final Integer lapIndex;
    private final Integer startIndex;
    private final Integer endIndex;
    private final BigDecimal distanceM;
    private final Integer elapsedTimeSec;
    private final Integer movingTimeSec;
    private final BigDecimal avgSpeedMs;
    private final BigDecimal maxSpeedMs;
    private final Short avgHeartrate;
    private final Short maxHeartrate;
    private final Short avgPowerW;
    private final Short maxPowerW;
    private final Short avgCadence;
    private final BigDecimal totalElevationGain;
    private final Short normalizedPowerW;
    private final BigDecimal variabilityIndex;
    private final BigDecimal powerDropPct;
    private final String intensityClass;
}
