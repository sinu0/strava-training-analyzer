package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import pl.strava.analizator.domain.gamification.PersonalRecord;
import pl.strava.analizator.infrastructure.persistence.entity.PersonalRecordEntity;

@Mapper(componentModel = "spring")
public interface PersonalRecordMapper {

    @Mapping(target = "recordType",
            expression = "java(entity.getRecordType() != null ? pl.strava.analizator.domain.gamification.PersonalRecordType.valueOf(entity.getRecordType()) : null)")
    PersonalRecord toDomain(PersonalRecordEntity entity);

    @Mapping(target = "recordType",
            expression = "java(domain.getRecordType() != null ? domain.getRecordType().name() : null)")
    @Mapping(target = "createdAt", ignore = true)
    PersonalRecordEntity toEntity(PersonalRecord domain);
}
