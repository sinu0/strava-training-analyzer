package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FatigueFactorsDto {
    private double atlFatigue;
    private double muscularFatigue;
    private double metabolicFatigue;
    private double ansFatigue;
    private int compositeScore;
    private String statusLabel;
    private String description;
}
