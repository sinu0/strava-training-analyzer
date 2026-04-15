package pl.strava.analizator.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.AchievementEntity;

public interface AchievementJpaRepository extends JpaRepository<AchievementEntity, String> {
}
