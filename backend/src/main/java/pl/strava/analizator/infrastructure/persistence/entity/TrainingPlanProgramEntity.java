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
@Table(name = "training_plan_programs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingPlanProgramEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "goal", nullable = false, length = 30)
    private String goal;

    @Column(name = "goal_priority", length = 5)
    private String goalPriority;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "taper_start_date")
    private LocalDate taperStartDate;

    @Column(name = "target_weekly_tss", precision = 8, scale = 2)
    private BigDecimal targetWeeklyTss;

    @Column(name = "target_weekly_hours", precision = 5, scale = 2)
    private BigDecimal targetWeeklyHours;

    @Column(name = "weekday_availability_minutes")
    private Integer weekdayAvailabilityMinutes;

    @Column(name = "weekend_availability_minutes")
    private Integer weekendAvailabilityMinutes;

    @Column(name = "preferred_long_ride_day", length = 15)
    private String preferredLongRideDay;

    @Column(name = "environment_preference", length = 30)
    private String environmentPreference;

    @Column(name = "generated_by", nullable = false, length = 20)
    private String generatedBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
