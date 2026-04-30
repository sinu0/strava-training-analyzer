package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DurabilityInsightDto {
    private String trend;
    private String label;
    private String description;
    private BigDecimal avgAerobicDecoupling;
    private BigDecimal avgPowerFade;
    private Integer avgDurabilityScore;
    private List<DurabilityWorkoutDto> workouts;
}
