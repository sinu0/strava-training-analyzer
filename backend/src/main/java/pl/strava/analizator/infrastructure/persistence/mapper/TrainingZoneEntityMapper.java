package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;

import pl.strava.analizator.domain.model.TrainingZone;
import pl.strava.analizator.infrastructure.persistence.entity.TrainingZoneEntity;

@Mapper(componentModel = "spring")
public interface TrainingZoneEntityMapper {

    TrainingZone toDomain(TrainingZoneEntity entity);

    TrainingZoneEntity toEntity(TrainingZone domain);
}