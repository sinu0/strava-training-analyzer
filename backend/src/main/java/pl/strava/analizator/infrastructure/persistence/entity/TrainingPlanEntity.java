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
