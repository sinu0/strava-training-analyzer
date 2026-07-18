package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "daily_metric_values", uniqueConstraints = {
        @UniqueConstraint(name = "uq_daily_metric", columnNames = {"date", "metric_name"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyMetricValueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "metric_name", nullable = false, length = 100)
    private String metricName;

    @Column(name = "value_numeric")
    private BigDecimal valueNumeric;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "value_json", columnDefinition = "jsonb")
    private Map<String, Object> valueJson;

    @Column(name = "calculator_version", length = 20)
    private String calculatorVersion;

    @Column(name = "input_fingerprint", length = 64)
    private String inputFingerprint;

    @Column(name = "as_of")
    private LocalDate asOf;

    @Column(name = "calculated_at")
    private Instant calculatedAt;
}
