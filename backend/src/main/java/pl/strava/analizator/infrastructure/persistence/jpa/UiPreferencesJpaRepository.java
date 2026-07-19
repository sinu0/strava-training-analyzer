package pl.strava.analizator.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.UiPreferencesEntity;

public interface UiPreferencesJpaRepository extends JpaRepository<UiPreferencesEntity, Short> {
}
