package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.ai.AiNoteJob;
import pl.strava.analizator.domain.port.AiNoteJobRepository;
import pl.strava.analizator.infrastructure.persistence.entity.AiNoteJobEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AiNoteJobJpaRepository;

@Component
@RequiredArgsConstructor
public class AiNoteJobRepositoryAdapter implements AiNoteJobRepository {

    private final AiNoteJobJpaRepository jpaRepository;

    @Override
    public AiNoteJob save(AiNoteJob job) {
        AiNoteJobEntity entity = AiNoteJobEntity.builder()
                .id(job.getId())
                .activityId(job.getActivityId())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .errorMessage(job.getErrorMessage())
                .retryCount(job.getRetryCount())
                .build();
        AiNoteJobEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<AiNoteJob> findNextPending() {
        return jpaRepository.findFirstByStatusOrderByCreatedAtAsc(AiNoteJob.STATUS_PENDING)
                .map(this::toDomain);
    }

    @Override
    public Optional<AiNoteJob> findByActivityId(UUID activityId) {
        return jpaRepository.findByActivityId(activityId).map(this::toDomain);
    }

    @Override
    public List<AiNoteJob> findByStatus(String status) {
        return jpaRepository.findByStatus(status).stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional
    public void deleteByActivityId(UUID activityId) {
        jpaRepository.deleteByActivityId(activityId);
    }

    private AiNoteJob toDomain(AiNoteJobEntity entity) {
        return AiNoteJob.builder()
                .id(entity.getId())
                .activityId(entity.getActivityId())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .errorMessage(entity.getErrorMessage())
                .retryCount(entity.getRetryCount())
                .build();
    }
}
