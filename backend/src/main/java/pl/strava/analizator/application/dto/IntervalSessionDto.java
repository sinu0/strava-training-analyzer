package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntervalSessionDto {
    private String date;
    private String activityId;
    private String intervalType;
    private int intervalCount;
    private int avgDurationSec;
    private double avgPowerPct;
    private int totalWorkSec;
    private double restRatio;
    private int qualityScore;
}
