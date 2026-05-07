package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class DailySummary {

    private UUID id;
    private LocalDate date;

    private Short activitiesCount;
    private BigDecimal totalDistanceM;
    private Integer totalTimeSec;
    private BigDecimal totalElevationM;

    // Health data
    private Short restingHrBpm;
    private BigDecimal hrvRmssd;
    private Short sleepScore;
    private Short bodyBattery;
    private Short stressAvg;
    private Integer sleepDurationSeconds;
    private Integer steps;
    private Integer activeCalories;
    private Integer deepSleepSeconds;
    private Integer lightSleepSeconds;
    private Integer remSleepSeconds;
    private Integer awakeSleepSeconds;
    private Short checkInSleepQuality;
    private Short checkInLegFreshness;
    private Short checkInMotivation;
    private Short checkInSoreness;
    private Instant checkInUpdatedAt;
    private Instant healthMetricsUpdatedAt;

    private Instant createdAt;
    private Instant updatedAt;
}
