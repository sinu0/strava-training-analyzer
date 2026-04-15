package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Weekly training load with optimal range bands derived from the TSB/PMC model.
 *
 * Optimal range is based on the Acute:Chronic Workload Ratio (ACWR):
 *   optimalMin      = CTL × 7 × 0.8   (lower safe bound, ACWR ~ 0.8)
 *   optimalTarget   = CTL × 7 × 1.0   (maintain current fitness)
 *   optimalMax      = CTL × 7 × 1.3   (upper safe build, ACWR ~ 1.3)
 *   dangerThreshold = CTL × 7 × 1.5   (injury-risk zone, ACWR ~ 1.5)
 */
@Getter
@Builder
@AllArgsConstructor
public class WeeklyOptimalLoadDto {

    private final LocalDate weekStart;
    private final int activityCount;
    private final BigDecimal actualTss;
    private final BigDecimal ctl;
    private final BigDecimal optimalMin;
    private final BigDecimal optimalTarget;
    private final BigDecimal optimalMax;
    private final BigDecimal dangerThreshold;

    /** INSUFFICIENT | UNDER | OPTIMAL | OVER | DANGER | NO_DATA */
    private final String status;
}
