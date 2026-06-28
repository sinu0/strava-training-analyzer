package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import pl.strava.analizator.domain.challenge.Challenge;
import pl.strava.analizator.infrastructure.persistence.entity.ChallengeEntity;

@Mapper(componentModel = "spring")
public interface ChallengeMapper {

    @Mapping(target = "type",
            expression = "java(entity.getType() != null ? pl.strava.analizator.domain.challenge.ChallengeType.valueOf(entity.getType()) : null)")
    @Mapping(target = "status",
            expression = "java(entity.getStatus() != null ? pl.strava.analizator.domain.challenge.ChallengeStatus.valueOf(entity.getStatus()) : null)")
    Challenge toDomain(ChallengeEntity entity);

    @Mapping(target = "type",
            expression = "java(domain.getType() != null ? domain.getType().name() : null)")
    @Mapping(target = "status",
            expression = "java(domain.getStatus() != null ? domain.getStatus().name() : null)")
    ChallengeEntity toEntity(Challenge domain);
}
