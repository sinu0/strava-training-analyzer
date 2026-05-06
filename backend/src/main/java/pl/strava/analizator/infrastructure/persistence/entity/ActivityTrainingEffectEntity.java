package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

@Entity
@Table(name = "activity_training_effects")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityTrainingEffectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "activity_id", nullable = false, unique = true)
    private UUID activityId;

    @Column(name = "training_score", nullable = false)
    private int trainingScore;

    @Column(name = "aerobic_te")
    private BigDecimal aerobicTe;

    @Column(name = "anaerobic_te")
    private BigDecimal anaerobicTe;

    @Column(name = "aerobic_label", length = 30)
    private String aerobicLabel;

    @Column(name = "anaerobic_label", length = 30)
    private String anaerobicLabel;

    @Column(name = "primary_benefit", nullable = false, length = 30)
    private String primaryBenefit;

    @Column(name = "secondary_benefit", length = 30)
    private String secondaryBenefit;

    @Column(name = "recovery_time_hours", nullable = false)
    private int recoveryTimeHours;

    @Column(name = "calculated_at", nullable = false)
    private Instant calculatedAt;

    @Column(name = "data_quality", nullable = false, length = 20)
    private String dataQuality;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", columnDefinition = "jsonb")
    private Map<String, Object> details;
}
