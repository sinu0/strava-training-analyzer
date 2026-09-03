package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AnalysisBackfillState;
import pl.strava.analizator.domain.port.AnalysisBackfillRepository;
import pl.strava.analizator.infrastructure.persistence.entity.AnalysisBackfillStateEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AnalysisBackfillStateJpaRepository;

@Component
@RequiredArgsConstructor
public class AnalysisBackfillRepositoryAdapter implements AnalysisBackfillRepository {
    private final AnalysisBackfillStateJpaRepository repository;
    @Override public AnalysisBackfillState save(AnalysisBackfillState value) { return toDomain(repository.save(toEntity(value))); }
    @Override public Optional<AnalysisBackfillState> find(String jobType) { return repository.findById(jobType).map(this::toDomain); }
    private AnalysisBackfillStateEntity toEntity(AnalysisBackfillState v) {
        return AnalysisBackfillStateEntity.builder().jobType(v.getJobType()).status(v.getStatus()).processed(v.getProcessed())
                .total(v.getTotal()).capability(v.getCapability()).rateLimitResetsAt(v.getRateLimitResetsAt())
                .errorMessage(v.getErrorMessage()).startedAt(v.getStartedAt()).updatedAt(v.getUpdatedAt())
                .completedAt(v.getCompletedAt()).build();
    }
    private AnalysisBackfillState toDomain(AnalysisBackfillStateEntity v) {
        return AnalysisBackfillState.builder().jobType(v.getJobType()).status(v.getStatus()).processed(v.getProcessed())
                .total(v.getTotal()).capability(v.getCapability()).rateLimitResetsAt(v.getRateLimitResetsAt())
                .errorMessage(v.getErrorMessage()).startedAt(v.getStartedAt()).updatedAt(v.getUpdatedAt())
                .completedAt(v.getCompletedAt()).build();
    }
}
