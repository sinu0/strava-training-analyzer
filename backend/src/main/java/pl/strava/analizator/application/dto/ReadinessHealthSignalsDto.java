package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessHealthSignalsDto {
    private LocalDate sourceDate;
    private Short sleepScore;
    private Short bodyBattery;
    private Short restingHrBpm;
    private BigDecimal restingHrDelta;
    private Integer scoreAdjustment;
}
