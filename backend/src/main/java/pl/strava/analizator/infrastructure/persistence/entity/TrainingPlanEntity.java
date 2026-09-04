package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
@Table(name = "training_plans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingPlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "planned_type", length = 50)
    private String plannedType;

    @Column(name = "planned_tss", precision = 6, scale = 2)
    private BigDecimal plannedTss;

    @Column(name = "planned_duration_min")
    private Integer plannedDurationMin;

    @Column(name = "planned_description", columnDefinition = "TEXT")
    private String plannedDescription;

    @Column(name = "actual_activity_id")
    private UUID actualActivityId;

    @Column(name = "compliance_pct", precision = 5, scale = 2)
    private BigDecimal compliancePct;

    @Column(name = "program_id")
    private UUID programId;

    @Column(name = "workout_template_id")
    private UUID workoutTemplateId;

    @Column(name = "workout_template_revision_id")
    private UUID workoutTemplateRevisionId;

    @Column(name = "workout_template_revision")
    private Integer workoutTemplateRevision;

    @Column(name = "workout_name_snapshot", length = 100)
    private String workoutNameSnapshot;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "workout_steps_snapshot", nullable = false, columnDefinition = "jsonb")
    private String workoutStepsSnapshot;

    @Column(name = "ftp_watts")
    private Integer ftpWatts;

    @Column(name = "lthr_bpm")
    private Integer lthrBpm;

    @Column(name = "max_hr_bpm")
    private Integer maxHrBpm;

    @Column(name = "resting_hr_bpm")
    private Integer restingHrBpm;

    @Column(name = "delivery_method", nullable = false, length = 30)
    private String deliveryMethod;

    @Column(name = "delivery_status", nullable = false, length = 30)
    private String deliveryStatus;

    @Column(name = "activity_match_status", nullable = false, length = 30)
    private String activityMatchStatus;

    @Column(name = "target_power_low_w")
    private Integer targetPowerLowW;

    @Column(name = "target_power_high_w")
    private Integer targetPowerHighW;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
