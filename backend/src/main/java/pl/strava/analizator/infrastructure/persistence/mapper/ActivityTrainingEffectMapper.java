package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;

import pl.strava.analizator.domain.model.ActivityTrainingEffect;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityTrainingEffectEntity;

@Mapper(componentModel = "spring")
public interface ActivityTrainingEffectMapper {

    ActivityTrainingEffect toDomain(ActivityTrainingEffectEntity entity);

    ActivityTrainingEffectEntity toEntity(ActivityTrainingEffect domain);
}
