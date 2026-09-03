package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
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
@Table(name = "matched_routes")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MatchedRouteEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "route_group_id") private UUID routeGroupId;
    @Column(name = "activity_id") private UUID activityId;
    @Column(name = "matched_to_activity_id") private UUID matchedToActivityId;
    @Column(name = "similarity_percent") private BigDecimal similarityPercent;
    @Column(name = "exact_match") private boolean exactMatch;
    @Column(name = "direction_variant") private String directionVariant;
    @Column(name = "algorithm_version") private int algorithmVersion;
    @Column(name = "created_at") private Instant createdAt;
}
