package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Result of a metric calculation. Can be either a simple numeric value
 * or a complex JSON-serializable object (for structured metrics like time_in_zones).
 */
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class MetricResult {

    private final String metricName;
    private final BigDecimal numericValue;
    private final Map<String, Object> jsonValue;
    private final String calculatorVersion;
    private final String inputFingerprint;
    private final LocalDate asOf;
    private final Instant calculatedAt;

    public static MetricResult numeric(String name, double value) {
        return MetricResult.builder()
                .metricName(name)
                .numericValue(BigDecimal.valueOf(value))
                .calculatorVersion("legacy-v1")
                .calculatedAt(Instant.now())
                .build();
    }

    public static MetricResult numeric(String name, BigDecimal value) {
        return MetricResult.builder()
                .metricName(name)
                .numericValue(value)
                .calculatorVersion("legacy-v1")
                .calculatedAt(Instant.now())
                .build();
    }

    public static MetricResult json(String name, Map<String, Object> value) {
        return MetricResult.builder()
                .metricName(name)
                .jsonValue(value)
                .calculatorVersion("legacy-v1")
                .calculatedAt(Instant.now())
                .build();
    }

    public boolean isNumeric() {
        return numericValue != null;
    }

    public MetricResult withProvenance(String version, String fingerprint, LocalDate effectiveDate) {
        return toBuilder()
                .calculatorVersion(version)
                .inputFingerprint(fingerprint)
                .asOf(effectiveDate)
                .build();
    }
}
