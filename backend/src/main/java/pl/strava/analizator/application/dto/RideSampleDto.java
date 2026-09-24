package pl.strava.analizator.application.dto;

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
public class RideSampleDto {
    private long atMs;
    private long elapsedMs;
    private int stepIndex;
    private Integer powerWatts;
    private Integer heartRateBpm;
    private Integer cadenceRpm;
    private Double speedKph;
}
