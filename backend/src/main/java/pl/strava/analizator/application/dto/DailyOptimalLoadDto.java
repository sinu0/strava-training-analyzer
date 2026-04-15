package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Daily training load with optimal TSS bands and PMC projection.
 *
 * Past days contain actual TSS and real CTL/ATL/TSB from the database.
 * Future days (isFuture=true) contain projected CTL/ATL/TSB and a projected
 * TSS target based on the recent training/rest rhythm.
 *
 * Optimal daily TSS range (based on ACWR / Banister model):
 *   - training days redistribute weekly CTL across expected training days
 *   - rest days expose a zero target/range
 */
@Getter
@Builder
@AllArgsConstructor
public class DailyOptimalLoadDto {

    private final LocalDate date;

    /** Actual TSS for past days; null for future projection days. */
    private final BigDecimal actualTss;

    /** Projected TSS target for future days; null for past days. */
    private final BigDecimal projectedTss;

    private final BigDecimal ctl;
    private final BigDecimal atl;
    private final BigDecimal tsb;

    private final BigDecimal optimalMin;
    private final BigDecimal optimalTarget;
    private final BigDecimal optimalMax;
    private final BigDecimal dangerThreshold;

    /** INSUFFICIENT | UNDER | OPTIMAL | OVER | DANGER | NO_DATA | FUTURE */
    private final String status;

    /** True for projection days beyond today. */
    private final boolean future;
}
