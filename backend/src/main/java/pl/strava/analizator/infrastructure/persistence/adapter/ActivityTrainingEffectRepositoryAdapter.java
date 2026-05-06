package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ActivityTrainingEffect;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityTrainingEffectJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.ActivityTrainingEffectMapper;

@Component
@RequiredArgsConstructor
public class ActivityTrainingEffectRepositoryAdapter implements ActivityTrainingEffectRepository {

    private final ActivityTrainingEffectJpaRepository jpa;
    private final ActivityTrainingEffectMapper mapper;

    @Override
    public Optional<ActivityTrainingEffect> findByActivityId(UUID activityId) {
        return jpa.findByActivityId(activityId).map(mapper::toDomain);
    }

    @Override
    public void save(ActivityTrainingEffect effect) {
        var existing = jpa.findByActivityId(effect.getActivityId());
        var entity = mapper.toEntity(effect);
        existing.ifPresent(e -> entity.setId(e.getId()));
        jpa.save(entity);
    }

    @Override
    public void deleteByActivityId(UUID activityId) {
        jpa.deleteByActivityId(activityId);
    }
}
