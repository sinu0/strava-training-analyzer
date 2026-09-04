package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WorkoutTemplateJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WorkoutTemplateRevisionJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.WorkoutTemplateMapper;
import pl.strava.analizator.infrastructure.persistence.entity.WorkoutTemplateRevisionEntity;

@Component
@RequiredArgsConstructor
public class WorkoutTemplateRepositoryAdapter implements WorkoutTemplateRepository {

    private final WorkoutTemplateJpaRepository jpaRepository;
    private final WorkoutTemplateRevisionJpaRepository revisionJpaRepository;
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
    @Transactional
    public WorkoutTemplate save(WorkoutTemplate template) {
        var entity = mapper.toEntity(template);
        var saved = jpaRepository.save(entity);
        int revision = saved.getCurrentRevision() > 0 ? saved.getCurrentRevision() : 1;
        var savedTemplate = saved;
        var revisionEntity = revisionJpaRepository.findByTemplateIdAndRevision(savedTemplate.getId(), revision)
                .orElseGet(() -> revisionJpaRepository.save(WorkoutTemplateRevisionEntity.builder()
                        .templateId(savedTemplate.getId())
                        .revision(revision)
                        .name(savedTemplate.getName())
                        .category(savedTemplate.getCategory())
                        .description(savedTemplate.getDescription())
                        .targetTss(savedTemplate.getTargetTss())
                        .targetDurationMin(savedTemplate.getTargetDurationMin())
                        .relativeEffort(savedTemplate.getRelativeEffort())
                        .intensityFactor(savedTemplate.getIntensityFactor())
                        .steps(savedTemplate.getSteps())
                        .createdBy(savedTemplate.getCreatedBy())
                        .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                        .build()));
        saved.setCurrentRevisionId(revisionEntity.getId());
        saved = jpaRepository.save(saved);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
