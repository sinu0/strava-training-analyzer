package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Result of a metric calculation. Can be either a simple numeric value
 * or a complex JSON-serializable object (for structured metrics like time_in_zones).
 */
@Getter
@Builder
@AllArgsConstructor
public class MetricResult {

    private final String metricName;
    private final BigDecimal numericValue;
    private final Map<String, Object> jsonValue;
    private final String calculatorVersion;
    private final Instant calculatedAt;

    public static MetricResult numeric(String name, double value) {
        return MetricResult.builder()
                .metricName(name)
                .numericValue(BigDecimal.valueOf(value))
                .calculatedAt(Instant.now())
                .build();
    }

    public static MetricResult numeric(String name, BigDecimal value) {
        return MetricResult.builder()
                .metricName(name)
                .numericValue(value)
                .calculatedAt(Instant.now())
                .build();
    }

    public static MetricResult json(String name, Map<String, Object> value) {
        return MetricResult.builder()
                .metricName(name)
                .jsonValue(value)
                .calculatedAt(Instant.now())
                .build();
    }

    public boolean isNumeric() {
        return numericValue != null;
    }
}
