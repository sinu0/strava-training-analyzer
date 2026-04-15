package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;

import pl.strava.analizator.domain.model.WeightGoal;
import pl.strava.analizator.domain.model.WeightRecord;
import pl.strava.analizator.infrastructure.persistence.entity.WeightGoalEntity;
import pl.strava.analizator.infrastructure.persistence.entity.WeightHistoryEntity;

@Mapper(componentModel = "spring")
public interface WeightEntityMapper {

    WeightRecord toDomain(WeightHistoryEntity entity);

    WeightHistoryEntity toEntity(WeightRecord domain);

    WeightGoal toGoalDomain(WeightGoalEntity entity);

    WeightGoalEntity toGoalEntity(WeightGoal domain);
}
