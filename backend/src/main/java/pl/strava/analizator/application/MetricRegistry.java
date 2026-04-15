package pl.strava.analizator.application;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricRegistry {

    private final List<ActivityMetricCalculator<?>> activityCalculators;
    private final ObjectMapper objectMapper;

    public Map<String, MetricResult> calculateAllActivityMetrics(Activity activity, AthleteProfile profile) {
        Map<String, MetricResult> results = new HashMap<>();

        for (ActivityMetricCalculator<?> calculator : activityCalculators) {
            if (!calculator.supports(activity)) {
                continue;
            }

            try {
                Object value = calculator.calculate(activity, profile);
                MetricResult result = toMetricResult(calculator.metricName(), value);
                results.put(calculator.metricName(), result);
            } catch (MetricCalculationException e) {
                log.warn("Metric calculation failed for {}: {}", calculator.metricName(), e.getMessage());
            } catch (Exception e) {
                log.warn("Unexpected error in metric calculator {}: {}", calculator.metricName(), e.getMessage(), e);
            }
        }

        return results;
    }

    @SuppressWarnings("unchecked")
    private MetricResult toMetricResult(String metricName, Object value) {
        if (value instanceof Number number) {
            return MetricResult.numeric(metricName, number.doubleValue());
        }
        if (value instanceof Map) {
            return MetricResult.json(metricName, (Map<String, Object>) value);
        }
        try {
            Map<String, Object> jsonValue = objectMapper.convertValue(value, new TypeReference<Map<String, Object>>() {});
            return MetricResult.json(metricName, jsonValue);
        } catch (IllegalArgumentException ex) {
            log.warn("Could not serialize metric {} to JSON: {}", metricName, ex.getMessage());
            return MetricResult.json(metricName, Map.of("value", String.valueOf(value)));
        }
    }
}
