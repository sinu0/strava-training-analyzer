package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentComparisonPointDto {
    private double distanceM;
    private Double timeSec;
    private Double timeDeltaSec;
    private Double powerW;
    private Double heartrate;
    private Double speedMs;
    private Double cadence;
    private Double altitudeM;
    private Double latitude;
    private Double longitude;
}
