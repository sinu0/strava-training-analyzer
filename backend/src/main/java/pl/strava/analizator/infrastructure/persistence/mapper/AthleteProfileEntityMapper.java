package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.infrastructure.persistence.entity.AthleteProfileEntity;

@Mapper(componentModel = "spring")
public interface AthleteProfileEntityMapper {

    AthleteProfile toDomain(AthleteProfileEntity entity);

    AthleteProfileEntity toEntity(AthleteProfile domain);
}
