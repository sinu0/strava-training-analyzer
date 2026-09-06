package pl.strava.analizator.infrastructure.web;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.strava.analizator.application.dto.TrainingContextDto;
import pl.strava.analizator.domain.model.TrainingPreferences;

@Mapper(componentModel = "spring")
public interface TrainingContextMapper {
    @Mapping(target = "timezone", ignore = true)
    @Mapping(target = "asOf", ignore = true)
    TrainingContextDto toDto(TrainingPreferences preferences);
    TrainingPreferences toDomain(TrainingContextDto dto);
}
