package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "activities", uniqueConstraints = {
        @UniqueConstraint(name = "uq_activity_source", columnNames = {"external_id", "source"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id")
    private String externalId;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "sport_type", nullable = false)
    private String sportType;

    @Column(name = "name")
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "elapsed_time_sec")
    private Integer elapsedTimeSec;

    @Column(name = "moving_time_sec")
    private Integer movingTimeSec;

    @Column(name = "distance_m")
    private BigDecimal distanceM;

    @Column(name = "elevation_gain_m")
    private BigDecimal elevationGainM;

    @Column(name = "elevation_loss_m")
    private BigDecimal elevationLossM;

    @Column(name = "avg_speed_ms")
    private BigDecimal avgSpeedMs;

    @Column(name = "max_speed_ms")
    private BigDecimal maxSpeedMs;

    @Column(name = "avg_heartrate")
    private Short avgHeartrate;

    @Column(name = "max_heartrate")
    private Short maxHeartrate;

    @Column(name = "avg_power_w")
    private Short avgPowerW;

    @Column(name = "max_power_w")
    private Short maxPowerW;

    @Column(name = "avg_cadence")
    private Short avgCadence;

    @Column(name = "max_cadence")
    private Short maxCadence;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "avg_temp_c")
    private BigDecimal avgTempC;

    @Column(name = "gear_id")
    private UUID gearId;

    @Column(name = "summary_polyline", columnDefinition = "TEXT")
    private String summaryPolyline;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photo_urls", columnDefinition = "jsonb")
    private List<String> photoUrls;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "streams", columnDefinition = "jsonb")
    private StreamsJson streams;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "splits", columnDefinition = "jsonb")
    private Object splits;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "laps", columnDefinition = "jsonb")
    private List<Map<String, Object>> laps;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "jsonb")
    private Object rawData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weather", columnDefinition = "jsonb")
    private Object weather;

    @Column(name = "tags", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] tags;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    /**
     * Inner class for typed JSONB streams mapping.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StreamsJson {
        private int[] power;
        private int[] heartrate;
        private int[] cadence;
        private double[] altitude;
        private int[] time;
        private double[] lat;
        private double[] lng;
        private double[] distance;
        private double[] velocity;
    }
}
