package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import pl.strava.analizator.domain.gamification.Achievement;
import pl.strava.analizator.domain.gamification.AchievementType;
import pl.strava.analizator.infrastructure.persistence.entity.AchievementEntity;

@Mapper(componentModel = "spring")
public interface AchievementMapper {

    @Mapping(target = "type",
            expression = "java(entity.getType() != null ? pl.strava.analizator.domain.gamification.AchievementType.valueOf(entity.getType()) : null)")
    Achievement toDomain(AchievementEntity entity);

    @Mapping(target = "type",
            expression = "java(domain.getType() != null ? domain.getType().name() : null)")
    AchievementEntity toEntity(Achievement domain);
}
