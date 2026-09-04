package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

@Entity
@Table(name = "workout_template_revisions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"template_id", "revision"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateRevisionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "revision", nullable = false)
    private int revision;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "category", nullable = false, length = 30)
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_tss", precision = 6, scale = 2)
    private BigDecimal targetTss;

    @Column(name = "target_duration_min", nullable = false)
    private int targetDurationMin;

    @Column(name = "relative_effort")
    private Integer relativeEffort;

    @Column(name = "intensity_factor", precision = 4, scale = 3)
    private BigDecimal intensityFactor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "steps", nullable = false, columnDefinition = "jsonb")
    private String steps;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
