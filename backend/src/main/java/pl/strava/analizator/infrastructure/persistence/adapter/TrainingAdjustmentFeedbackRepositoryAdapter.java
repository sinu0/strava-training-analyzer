package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.TrainingAdjustmentFeedback;
import pl.strava.analizator.domain.port.TrainingAdjustmentFeedbackRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.TrainingAdjustmentFeedbackJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.TrainingAdjustmentFeedbackMapper;

@Component
@RequiredArgsConstructor
public class TrainingAdjustmentFeedbackRepositoryAdapter implements TrainingAdjustmentFeedbackRepository {

    private final TrainingAdjustmentFeedbackJpaRepository jpaRepository;
    private final TrainingAdjustmentFeedbackMapper mapper;

    @Override
    public TrainingAdjustmentFeedback save(TrainingAdjustmentFeedback feedback) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(feedback)));
    }

    @Override
    public List<TrainingAdjustmentFeedback> findByCreatedAtAfter(OffsetDateTime createdAfter) {
        return jpaRepository.findByCreatedAtAfterOrderByCreatedAtDesc(createdAfter).stream()
                .map(mapper::toDomain)
                .toList();
    }
}
