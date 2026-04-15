package pl.strava.analizator.application.dto;

import java.math.BigDecimal;

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
public class LapDto {

    private int lapIndex;
    private String name;
    private int startIndex;
    private int endIndex;
    private BigDecimal distanceM;
    private Integer elapsedTimeSec;
    private Integer movingTimeSec;
    private BigDecimal avgSpeedMs;
    private BigDecimal maxSpeedMs;
    private Short avgHeartrate;
    private Short maxHeartrate;
    private Short avgPowerW;
    private Short maxPowerW;
    private Short avgCadence;
    private BigDecimal totalElevationGain;
}
