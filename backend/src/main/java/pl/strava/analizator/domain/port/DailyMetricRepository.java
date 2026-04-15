package pl.strava.analizator.domain.port;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.vo.DateRange;

public interface DailyMetricRepository {

    void save(LocalDate date, MetricResult result);

    void saveAll(LocalDate date, List<MetricResult> results);

    Optional<BigDecimal> findNumericValue(LocalDate date, String metricName);

    Optional<Map<String, Object>> findJsonValue(LocalDate date, String metricName);

    /**
     * Get time series of a numeric metric over a date range.
     * Returns entries ordered by date ascending.
     */
    Map<LocalDate, BigDecimal> findNumericSeries(String metricName, DateRange range);

    List<MetricResult> findAllByDate(LocalDate date);

    void deleteAll();
}
