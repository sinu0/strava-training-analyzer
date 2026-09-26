package pl.strava.analizator.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.AiSettingsEntity;

public interface AiSettingsJpaRepository extends JpaRepository<AiSettingsEntity, Short> {
}
