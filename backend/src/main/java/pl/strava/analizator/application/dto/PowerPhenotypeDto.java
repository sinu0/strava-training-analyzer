package pl.strava.analizator.application.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PowerPhenotypeDto {
    private String primaryType;
    private String secondaryType;
    private Map<String, Double> powerProfileWkg;
    private Map<String, Integer> percentiles;
    private String bestDuration;
    private String worstDuration;
    private double weaknessGapWkg;
    private String description;
    private String recommendation;
}
