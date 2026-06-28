package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.ChallengeEntity;

public interface ChallengeJpaRepository extends JpaRepository<ChallengeEntity, UUID> {

    List<ChallengeEntity> findByStatus(String status);
}
