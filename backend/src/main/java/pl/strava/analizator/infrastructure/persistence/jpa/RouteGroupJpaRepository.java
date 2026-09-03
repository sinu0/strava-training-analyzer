package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.RouteGroupEntity;

public interface RouteGroupJpaRepository extends JpaRepository<RouteGroupEntity, UUID> {
    Optional<RouteGroupEntity> findByFamilyIdAndDirectionKeyAndAlgorithmVersion(
            UUID familyId, String directionKey, int algorithmVersion);
}
