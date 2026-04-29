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
public class TrainingDayProjectionDto {
    private BigDecimal plannedTss;
    private BigDecimal projectedCtl;
    private BigDecimal projectedAtl;
    private BigDecimal projectedTsb;
    private int projectedReadiness;
    private String dayType;
    private String dayLabel;
    private boolean taperDay;
}
