package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "segments")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentEntity {
    @Id private Long id;
    private String name;
    @Column(name = "activity_type") private String activityType;
    @Column(name = "distance_m") private BigDecimal distanceM;
    @Column(name = "average_grade") private BigDecimal averageGrade;
    @Column(name = "maximum_grade") private BigDecimal maximumGrade;
    @Column(name = "elevation_high_m") private BigDecimal elevationHighM;
    @Column(name = "elevation_low_m") private BigDecimal elevationLowM;
    @Column(name = "start_latitude") private Double startLatitude;
    @Column(name = "start_longitude") private Double startLongitude;
    @Column(name = "end_latitude") private Double endLatitude;
    @Column(name = "end_longitude") private Double endLongitude;
    private String city;
    private String state;
    private String country;
    @Column(name = "private_segment") private boolean privateSegment;
    @Column(name = "local_favorite") private boolean localFavorite;
    @Column(name = "route_polyline", columnDefinition = "TEXT") private String routePolyline;
    @Column(name = "effort_count") private int effortCount;
    @Column(name = "best_elapsed_time_sec") private Integer bestElapsedTimeSec;
    @Column(name = "latest_effort_at") private OffsetDateTime latestEffortAt;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "updated_at") private Instant updatedAt;
}
