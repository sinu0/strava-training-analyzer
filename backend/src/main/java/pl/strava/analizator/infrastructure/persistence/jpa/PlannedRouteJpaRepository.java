package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import pl.strava.analizator.infrastructure.persistence.entity.PlannedRouteEntity;

public interface PlannedRouteJpaRepository extends JpaRepository<PlannedRouteEntity, UUID> {

    @Query(value = "SELECT * FROM planned_route ORDER BY created_at DESC LIMIT 100", nativeQuery = true)
    List<PlannedRouteEntity> findAllLimited();
}
