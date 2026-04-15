package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "ai_predictions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPredictionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "prediction_type", nullable = false)
    private String predictionType;

    @Column(name = "model_id", nullable = false)
    private String modelId;

    @Column(name = "provider_name", nullable = false)
    private String providerName;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structured_data", columnDefinition = "jsonb")
    private Map<String, Object> structuredData;

    @Column(name = "confidence", nullable = false)
    private BigDecimal confidence;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "actual_data", columnDefinition = "jsonb")
    private Map<String, Object> actualData;

    @Column(name = "accuracy_score")
    private BigDecimal accuracyScore;

    @Column(name = "verified_at")
    private Instant verifiedAt;
}
