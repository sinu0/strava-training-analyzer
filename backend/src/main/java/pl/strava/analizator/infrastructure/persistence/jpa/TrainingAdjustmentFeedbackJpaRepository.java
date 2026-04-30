package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.TrainingAdjustmentFeedbackEntity;

public interface TrainingAdjustmentFeedbackJpaRepository extends JpaRepository<TrainingAdjustmentFeedbackEntity, UUID> {
    List<TrainingAdjustmentFeedbackEntity> findByCreatedAtAfterOrderByCreatedAtDesc(OffsetDateTime createdAt);
}
