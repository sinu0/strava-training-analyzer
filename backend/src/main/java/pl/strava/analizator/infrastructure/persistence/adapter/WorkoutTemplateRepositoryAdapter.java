package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WorkoutTemplateJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.WorkoutTemplateMapper;

@Component
@RequiredArgsConstructor
public class WorkoutTemplateRepositoryAdapter implements WorkoutTemplateRepository {

    private final WorkoutTemplateJpaRepository jpaRepository;
    private final WorkoutTemplateMapper mapper;

    @Override
    public List<WorkoutTemplate> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<WorkoutTemplate> findByCategory(WorkoutCategory category) {
        return jpaRepository.findByCategory(category.name()).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<WorkoutTemplate> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public WorkoutTemplate save(WorkoutTemplate template) {
        var entity = mapper.toEntity(template);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
