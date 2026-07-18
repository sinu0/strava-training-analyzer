package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.ActivityDataQualityEntity;

public interface ActivityDataQualityJpaRepository extends JpaRepository<ActivityDataQualityEntity, UUID> {
}
