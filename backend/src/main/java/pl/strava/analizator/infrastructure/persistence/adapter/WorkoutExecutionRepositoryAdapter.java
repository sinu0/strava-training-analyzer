package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WorkoutExecutionJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.WorkoutExecutionMapper;

@Component
@RequiredArgsConstructor
public class WorkoutExecutionRepositoryAdapter implements WorkoutExecutionRepository {
    private final WorkoutExecutionJpaRepository repository;
    private final WorkoutExecutionMapper mapper;

    public Optional<WorkoutExecution> findById(UUID id) { return repository.findById(id).map(mapper::toDomain); }
    public Optional<WorkoutExecution> findByStartIdempotencyKey(String key) { return repository.findByStartIdempotencyKey(key).map(mapper::toDomain); }
    public Optional<WorkoutExecution> findByFinishIdempotencyKey(String key) { return repository.findByFinishIdempotencyKey(key).map(mapper::toDomain); }
    public Optional<WorkoutExecution> findActive() { return repository.findActive().map(mapper::toDomain); }
    public List<WorkoutExecution> findCompletedWithoutActivity() { return repository.findCompletedWithoutActivity().stream().map(mapper::toDomain).toList(); }
    public WorkoutExecution save(WorkoutExecution execution) { return mapper.toDomain(repository.save(mapper.toEntity(execution))); }
}
