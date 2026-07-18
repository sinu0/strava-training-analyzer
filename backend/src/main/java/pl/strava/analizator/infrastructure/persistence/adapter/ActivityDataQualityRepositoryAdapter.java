package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ActivityDataQuality;
import pl.strava.analizator.domain.port.ActivityDataQualityRepository;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityDataQualityEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityDataQualityJpaRepository;

@Component
@RequiredArgsConstructor
public class ActivityDataQualityRepositoryAdapter implements ActivityDataQualityRepository {
    private final ActivityDataQualityJpaRepository jpaRepository;

    @Override
    public ActivityDataQuality save(ActivityDataQuality quality) {
        return toDomain(jpaRepository.save(toEntity(quality)));
    }

    @Override
    public Optional<ActivityDataQuality> findByActivityId(UUID activityId) {
        return jpaRepository.findById(activityId).map(this::toDomain);
    }

    @Override
    public List<ActivityDataQuality> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    private ActivityDataQuality toDomain(ActivityDataQualityEntity entity) {
        return ActivityDataQuality.builder().activityId(entity.getActivityId())
                .status(entity.getStatus()).issues(entity.getIssues()).assessedAt(entity.getAssessedAt()).build();
    }

    private ActivityDataQualityEntity toEntity(ActivityDataQuality quality) {
        return ActivityDataQualityEntity.builder().activityId(quality.getActivityId())
                .status(quality.getStatus()).issues(quality.getIssues()).assessedAt(quality.getAssessedAt()).build();
    }
}
