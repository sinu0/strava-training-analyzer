package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.infrastructure.persistence.entity.DailyMetricValueEntity;

@Mapper(componentModel = "spring")
public interface DailyMetricValueEntityMapper {

    @Mapping(target = "numericValue", source = "valueNumeric")
    @Mapping(target = "jsonValue", source = "valueJson")
    MetricResult toDomain(DailyMetricValueEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "date", ignore = true)
    @Mapping(target = "valueNumeric", source = "numericValue")
    @Mapping(target = "valueJson", source = "jsonValue")
    DailyMetricValueEntity toEntity(MetricResult domain);
}
