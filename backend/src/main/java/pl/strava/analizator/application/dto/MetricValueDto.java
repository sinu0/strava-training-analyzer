package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.strava.analizator.domain.model.MetricResult;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricValueDto {

    private String name;
    private BigDecimal numericValue;
    private Map<String, Object> structuredValue;
    private String calculatorVersion;
    private String inputFingerprint;
    private LocalDate asOf;
    private Instant computedAt;

    public static MetricValueDto from(MetricResult result) {
        return MetricValueDto.builder()
                .name(result.getMetricName())
                .numericValue(result.getNumericValue())
                .structuredValue(result.getJsonValue())
                .calculatorVersion(result.getCalculatorVersion())
                .inputFingerprint(result.getInputFingerprint())
                .asOf(result.getAsOf())
                .computedAt(result.getCalculatedAt())
                .build();
    }
}
