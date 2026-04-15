package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

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
public class WeeklySummaryDto {

    private LocalDate weekStart;
    private int activityCount;
    private BigDecimal totalDistanceM;
    private int totalTimeSec;
    private BigDecimal totalElevationM;
    private BigDecimal totalTss;
}
