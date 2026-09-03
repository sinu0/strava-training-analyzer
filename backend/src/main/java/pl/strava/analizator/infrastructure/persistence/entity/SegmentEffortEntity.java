package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
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
@Table(name = "segment_efforts")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentEffortEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "external_id") private Long externalId;
    @Column(name = "segment_id", nullable = false) private Long segmentId;
    @Column(name = "activity_id", nullable = false) private UUID activityId;
    @Column(name = "started_at", nullable = false) private OffsetDateTime startedAt;
    @Column(name = "sequence_number") private int sequence;
    @Column(name = "start_index") private Integer startIndex;
    @Column(name = "end_index") private Integer endIndex;
    @Column(name = "elapsed_time_sec") private Integer elapsedTimeSec;
    @Column(name = "moving_time_sec") private Integer movingTimeSec;
    @Column(name = "distance_m") private BigDecimal distanceM;
    @Column(name = "average_power_w") private Short averagePowerW;
    @Column(name = "average_heartrate") private Short averageHeartrate;
    @Column(name = "max_heartrate") private Short maxHeartrate;
    @Column(name = "average_speed_ms") private BigDecimal averageSpeedMs;
    @Column(name = "average_cadence") private Short averageCadence;
    @Column(name = "elevation_gain_m") private BigDecimal elevationGainM;
    @Column(name = "device_watts") private Boolean deviceWatts;
    @Column(name = "strava_pr_rank") private Integer stravaPrRank;
    @Column(name = "record_at_time") private boolean recordAtTime;
    @Column(name = "previous_best_elapsed_time_sec") private Integer previousBestElapsedTimeSec;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "updated_at") private Instant updatedAt;
}
