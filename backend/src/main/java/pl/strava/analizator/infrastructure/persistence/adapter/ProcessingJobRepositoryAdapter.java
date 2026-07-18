package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;
import pl.strava.analizator.infrastructure.persistence.entity.ProcessingJobEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ProcessingJobJpaRepository;

@Component
@RequiredArgsConstructor
public class ProcessingJobRepositoryAdapter implements ProcessingJobRepository {

    private final ProcessingJobJpaRepository jpaRepository;

    @Override
    public ProcessingJob save(ProcessingJob job) {
        return toDomain(jpaRepository.save(toEntity(job)));
    }

    @Override
    public Optional<ProcessingJob> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsActive(String jobType) {
        return jpaRepository.existsByJobTypeAndStatusIn(jobType, List.of("QUEUED", "RUNNING"));
    }

    private ProcessingJob toDomain(ProcessingJobEntity entity) {
        return ProcessingJob.builder()
                .id(entity.getId())
                .jobType(entity.getJobType())
                .mode(entity.getMode())
                .stage(entity.getStage())
                .status(entity.getStatus())
                .attempt(entity.getAttempt())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private ProcessingJobEntity toEntity(ProcessingJob job) {
        return ProcessingJobEntity.builder()
                .id(job.getId())
                .jobType(job.getJobType())
                .mode(job.getMode())
                .stage(job.getStage())
                .status(job.getStatus())
                .attempt(job.getAttempt())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
