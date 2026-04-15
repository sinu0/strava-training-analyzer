package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;

import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.infrastructure.persistence.entity.DailySummaryEntity;

@Mapper(componentModel = "spring")
public interface DailySummaryEntityMapper {

    DailySummary toDomain(DailySummaryEntity entity);

    DailySummaryEntity toEntity(DailySummary domain);
}
