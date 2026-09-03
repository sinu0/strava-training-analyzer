package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.Instant;
import java.util.UUID;

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
@Table(name = "route_fingerprints")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RouteFingerprintEntity {
    @Id @Column(name = "activity_id") private UUID activityId;
    @Column(name = "algorithm_version") private int algorithmVersion;
    private String capability;
    @Column(name = "exact_hash", length = 64) private String exactHash;
    @Column(name = "reverse_hash", length = 64) private String reverseHash;
    @Column(name = "fuzzy_key") private String fuzzyKey;
    @Column(name = "normalized_polyline", columnDefinition = "TEXT") private String normalizedPolyline;
    @Column(name = "distance_m") private Double distanceM;
    @Column(name = "center_latitude") private Double centerLatitude;
    @Column(name = "center_longitude") private Double centerLongitude;
    @Column(name = "computed_at") private Instant computedAt;
}
