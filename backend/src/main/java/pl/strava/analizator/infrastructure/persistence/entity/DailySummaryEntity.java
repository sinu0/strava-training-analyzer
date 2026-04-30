package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
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
@Table(name = "daily_summary")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "date", nullable = false, unique = true)
    private LocalDate date;

    @Column(name = "activities_count")
    private Short activitiesCount;

    @Column(name = "total_distance_m")
    private BigDecimal totalDistanceM;

    @Column(name = "total_time_sec")
    private Integer totalTimeSec;

    @Column(name = "total_elevation_m")
    private BigDecimal totalElevationM;

    @Column(name = "resting_hr_bpm")
    private Short restingHrBpm;

    @Column(name = "hrv_rmssd")
    private BigDecimal hrvRmssd;

    @Column(name = "sleep_score")
    private Short sleepScore;

    @Column(name = "body_battery")
    private Short bodyBattery;

    @Column(name = "stress_avg")
    private Short stressAvg;

    @Column(name = "sleep_duration_seconds")
    private Integer sleepDurationSeconds;

    @Column(name = "steps")
    private Integer steps;

    @Column(name = "active_calories")
    private Integer activeCalories;

    @Column(name = "deep_sleep_seconds")
    private Integer deepSleepSeconds;

    @Column(name = "light_sleep_seconds")
    private Integer lightSleepSeconds;

    @Column(name = "rem_sleep_seconds")
    private Integer remSleepSeconds;

    @Column(name = "awake_sleep_seconds")
    private Integer awakeSleepSeconds;

    @Column(name = "check_in_sleep_quality")
    private Short checkInSleepQuality;

    @Column(name = "check_in_leg_freshness")
    private Short checkInLegFreshness;

    @Column(name = "check_in_motivation")
    private Short checkInMotivation;

    @Column(name = "check_in_soreness")
    private Short checkInSoreness;

    @Column(name = "check_in_updated_at")
    private Instant checkInUpdatedAt;

    @Column(name = "garmin_synced_at")
    private Instant garminSyncedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
