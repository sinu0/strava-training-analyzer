package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.AiPredictionEntity;

@Repository
public interface AiPredictionJpaRepository extends JpaRepository<AiPredictionEntity, UUID> {

    List<AiPredictionEntity> findByPredictionTypeOrderByCreatedAtDesc(String predictionType, Pageable pageable);

    List<AiPredictionEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AiPredictionEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to);

    List<AiPredictionEntity> findByPredictionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            String predictionType, Instant from, Instant to);

    boolean existsByPredictionTypeAndCreatedAtBetween(String predictionType, Instant from, Instant to);
}
