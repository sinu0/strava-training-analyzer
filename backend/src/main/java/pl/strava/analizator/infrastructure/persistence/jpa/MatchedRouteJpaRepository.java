package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.MatchedRouteEntity;

public interface MatchedRouteJpaRepository extends JpaRepository<MatchedRouteEntity, UUID> {
    Optional<MatchedRouteEntity> findByActivityIdAndAlgorithmVersion(UUID activityId, int algorithmVersion);
    List<MatchedRouteEntity> findByRouteGroupIdOrderByCreatedAtAsc(UUID routeGroupId);
}
