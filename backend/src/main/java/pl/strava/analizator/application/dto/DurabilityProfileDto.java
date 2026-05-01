package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DurabilityProfileDto {
    private int overallScore;
    private String trend;
    private String label;
    private String description;
    private int shortDurationResistance;
    private int mediumDurationResistance;
    private int longDurationResistance;
    private double avgAerobicDecoupling;
    private double avgPowerFade;
    private double fatigueResistanceIndex;
    private int recentWorkoutsCount;
    private String recommendation;
}
