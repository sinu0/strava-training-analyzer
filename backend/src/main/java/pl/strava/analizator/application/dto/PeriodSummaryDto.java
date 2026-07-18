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
public class PeriodSummaryDto {
    private LocalDate from;
    private LocalDate to;
    private int activityCount;
    private BigDecimal totalDistanceM;
    private int totalTimeSec;
    private BigDecimal totalElevationM;
}
