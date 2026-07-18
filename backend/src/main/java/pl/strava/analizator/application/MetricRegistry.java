package pl.strava.analizator.application;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HexFormat;
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
                MetricResult result = toMetricResult(calculator.metricName(), value)
                        .withProvenance(
                                calculator.calculatorVersion(),
                                fingerprint(activity, profile),
                                activity.getStartedAt() != null ? activity.getStartedAt().toLocalDate() : null);
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

    private String fingerprint(Activity activity, AthleteProfile profile) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            update(digest, activity.getExternalId());
            update(digest, activity.getStartedAt() != null ? activity.getStartedAt().toString() : null);
            update(digest, activity.getMovingTimeSec());
            update(digest, profile != null ? profile.getFtpWatts() : null);
            update(digest, profile != null ? profile.getLthrBpm() : null);
            update(digest, Arrays.hashCode(activity.getPowerStream()));
            update(digest, Arrays.hashCode(activity.getHeartrateStream()));
            update(digest, Arrays.hashCode(activity.getCadenceStream()));
            update(digest, Arrays.hashCode(activity.getTimeStream()));
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private void update(MessageDigest digest, Object value) {
        byte[] bytes = String.valueOf(value).getBytes(StandardCharsets.UTF_8);
        digest.update(ByteBuffer.allocate(Integer.BYTES).putInt(bytes.length).array());
        digest.update(bytes);
    }
}
