package pl.strava.analizator.application.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressionLevelDto {
    private String system;
    private String label;
    private int level;
    private BigDecimal currentLoad;
    private BigDecimal previousLoad;
    private BigDecimal targetLoad;
    private String trend;
    private String description;
    private String nextRecommendation;
}
