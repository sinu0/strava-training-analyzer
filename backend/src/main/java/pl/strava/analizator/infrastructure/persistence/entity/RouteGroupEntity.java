package pl.strava.analizator.infrastructure.persistence.entity;

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
@Table(name = "route_groups")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RouteGroupEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "family_id") private UUID familyId;
    @Column(name = "canonical_activity_id") private UUID canonicalActivityId;
    @Column(name = "direction_key", length = 64) private String directionKey;
    @Column(name = "algorithm_version") private int algorithmVersion;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "updated_at") private Instant updatedAt;
}
