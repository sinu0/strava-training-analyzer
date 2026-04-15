package pl.strava.analizator.application;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricPersistenceService {

    private final ActivityMetricRepository activityMetricRepository;

    public void saveActivityMetrics(UUID activityId, Map<String, MetricResult> metrics) {
        for (MetricResult metric : metrics.values()) {
            activityMetricRepository.save(activityId, metric);
            log.debug("Saved metric {} for activity {}", metric.getMetricName(), activityId);
        }
    }
}
