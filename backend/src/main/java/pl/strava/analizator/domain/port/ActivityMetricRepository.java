package pl.strava.analizator.domain.port;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.MetricResult;

public interface ActivityMetricRepository {

    void save(UUID activityId, MetricResult result);

    void saveAll(UUID activityId, List<MetricResult> results);

    Optional<BigDecimal> findNumericValue(UUID activityId, String metricName);

    Map<UUID, BigDecimal> findNumericValues(List<UUID> activityIds, String metricName);

    Optional<Map<String, Object>> findJsonValue(UUID activityId, String metricName);

    List<MetricResult> findAllByActivityId(UUID activityId);

    void deleteByActivityIdAndMetricName(UUID activityId, String metricName);

    void deleteAll();
}
