package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.AiCustomPromptEntity;

@Repository
public interface AiCustomPromptJpaRepository extends JpaRepository<AiCustomPromptEntity, UUID> {

    List<AiCustomPromptEntity> findByPredictionTypeOrderByUpdatedAtDesc(String predictionType);

    Optional<AiCustomPromptEntity> findByPredictionTypeAndActiveTrue(String predictionType);

    List<AiCustomPromptEntity> findAllByOrderByUpdatedAtDesc();
}
