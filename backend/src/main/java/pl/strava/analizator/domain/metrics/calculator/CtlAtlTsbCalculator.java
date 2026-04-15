package pl.strava.analizator.domain.metrics.calculator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pl.strava.analizator.domain.metrics.DailyTrainingLoad;
import pl.strava.analizator.domain.metrics.TimeSeriesMetricCalculator;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * CTL/ATL/TSB (Performance Management Chart) calculator using Exponential Moving Average.
 * CTL(d) = CTL(d-1) + (TSS(d) - CTL(d-1)) / τ_chronic   [τ = 42]
 * ATL(d) = ATL(d-1) + (TSS(d) - ATL(d-1)) / τ_acute      [τ = 7]
 * TSB(d) = CTL(d-1) - ATL(d-1)
 */
public class CtlAtlTsbCalculator implements TimeSeriesMetricCalculator<List<CtlAtlTsbCalculator.PmcDataPoint>> {

    private static final int TAU_CHRONIC = 42;
    private static final int TAU_ACUTE = 7;

    @Override
    public String metricName() {
        return "pmc";
    }

    @Override
    public List<PmcDataPoint> calculate(List<DailyTrainingLoad> history, AthleteProfile profile) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        // Sort by date and fill gaps with zero TSS
        TreeMap<LocalDate, BigDecimal> tssMap = new TreeMap<>();
        for (DailyTrainingLoad load : history) {
            tssMap.merge(load.getDate(), load.getTss(), BigDecimal::add);
        }

        LocalDate start = tssMap.firstEntry().getKey();
        LocalDate end = tssMap.lastEntry().getKey();

        List<PmcDataPoint> result = new ArrayList<>();
        double ctl = 0;
        double atl = 0;

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            double tss = tssMap.getOrDefault(date, BigDecimal.ZERO).doubleValue();
            double tsb = ctl - atl;
            ctl = ctl + (tss - ctl) / TAU_CHRONIC;
            atl = atl + (tss - atl) / TAU_ACUTE;

            result.add(PmcDataPoint.builder()
                    .date(date)
                    .ctl(ctl)
                    .atl(atl)
                    .tsb(tsb)
                    .tss(tss)
                    .build());
        }

        return result;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class PmcDataPoint {
        private final LocalDate date;
        private final double ctl;
        private final double atl;
        private final double tsb;
        private final double tss;
    }
}
