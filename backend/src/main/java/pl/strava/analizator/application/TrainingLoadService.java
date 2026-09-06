package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.LoadAnalyticsDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

/** Shared read model. A missing daily rollup is a gap, never a zero-load day. */
@Service
@RequiredArgsConstructor
public class TrainingLoadService {
    public static final BigDecimal MIN_COVERAGE = new BigDecimal("0.8");
    private final DailyMetricRepository repository;

    public List<PmcDataDto> getPoints(LocalDate from, LocalDate to) {
        DateRange range = DateRange.of(from.minusDays(1), to);
        Map<LocalDate, BigDecimal> ctl = repository.findNumericSeries("ctl", range);
        Map<LocalDate, BigDecimal> atl = repository.findNumericSeries("atl", range);
        Map<LocalDate, BigDecimal> tsb = repository.findNumericSeries("tsb", range);
        List<PmcDataDto> points = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            points.add(PmcDataDto.builder().date(date).ctl(ctl.get(date)).atl(atl.get(date)).tsb(tsb.get(date))
                    .ctlDelta(delta(ctl.get(date), ctl.get(date.minusDays(1))))
                    .atlDelta(delta(atl.get(date), atl.get(date.minusDays(1))))
                    .tsbDelta(delta(tsb.get(date), tsb.get(date.minusDays(1)))).build());
        }
        return points;
    }

    public LoadAnalyticsDto getLoad(LocalDate from, LocalDate to) {
        List<PmcDataDto> points = getPoints(from, to);
        Map<LocalDate, BigDecimal> coverage = repository.findNumericSeries("training_load_coverage", DateRange.of(from, to));
        long count = points.stream().filter(TrainingLoadService::complete).count();
        BigDecimal temporal = BigDecimal.valueOf(count).divide(
                BigDecimal.valueOf(ChronoUnit.DAYS.between(from, to) + 1), 4, RoundingMode.HALF_UP);
        BigDecimal loadCoverage = coverage.isEmpty() ? null : coverage.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(coverage.size()), 4, RoundingMode.HALF_UP);
        LocalDate asOf = points.stream().filter(TrainingLoadService::complete).map(PmcDataDto::getDate)
                .max(LocalDate::compareTo).orElse(null);
        String availability = count == 0 ? "UNKNOWN"
                : temporal.compareTo(BigDecimal.ONE) < 0 || loadCoverage == null || loadCoverage.compareTo(MIN_COVERAGE) < 0
                    ? "PARTIAL" : "AVAILABLE";
        return LoadAnalyticsDto.builder().from(from).to(to).asOf(asOf).availability(availability)
                .coverage(loadCoverage).temporalCoverage(temporal).points(points).build();
    }

    public static boolean complete(PmcDataDto point) {
        return point.getCtl() != null && point.getAtl() != null && point.getTsb() != null;
    }

    private BigDecimal delta(BigDecimal value, BigDecimal previous) {
        return value == null || previous == null ? null : value.subtract(previous);
    }
}
