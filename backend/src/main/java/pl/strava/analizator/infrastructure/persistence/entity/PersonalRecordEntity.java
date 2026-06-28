package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.Instant;
import java.time.LocalDate;
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
@Table(name = "personal_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "record_type", nullable = false, length = 50)
    private String recordType;

    @Column(name = "record_value", nullable = false)
    private double recordValue;

    @Column(name = "activity_id")
    private UUID activityId;

    @Column(name = "achieved_at", nullable = false)
    private LocalDate achievedAt;

    @Column(name = "previous_value")
    private Double previousValue;

    @Column(name = "improvement_percent")
    private Double improvementPercent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
