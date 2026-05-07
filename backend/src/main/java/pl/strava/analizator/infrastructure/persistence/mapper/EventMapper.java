package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;

import pl.strava.analizator.domain.model.Event;
import pl.strava.analizator.infrastructure.persistence.entity.EventEntity;

@Mapper(componentModel = "spring")
public interface EventMapper {
    Event toDomain(EventEntity entity);
    EventEntity toEntity(Event domain);
}
