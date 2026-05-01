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
public class OptimizePlanRequest {
    private int weeks;
    private int trainingDaysPerWeek;
    private BigDecimal targetWeeklyTss;
    private BigDecimal currentCtl;
    private BigDecimal currentAtl;
    private int ftp;
    private LocalDate eventDate;
    private String goalPriority;
}
