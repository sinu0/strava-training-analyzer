package pl.strava.analizator.infrastructure.persistence.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.gamification.Achievement;
import pl.strava.analizator.infrastructure.persistence.entity.AchievementEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class AchievementMapperImpl implements AchievementMapper {

    @Override
    public Achievement toDomain(AchievementEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Achievement.AchievementBuilder achievement = Achievement.builder();

        achievement.description( entity.getDescription() );
        achievement.icon( entity.getIcon() );
        achievement.id( entity.getId() );
        achievement.name( entity.getName() );
        achievement.unlocked( entity.isUnlocked() );
        achievement.unlockedAt( entity.getUnlockedAt() );

        achievement.type( entity.getType() != null ? pl.strava.analizator.domain.gamification.AchievementType.valueOf(entity.getType()) : null );

        return achievement.build();
    }

    @Override
    public AchievementEntity toEntity(Achievement domain) {
        if ( domain == null ) {
            return null;
        }

        AchievementEntity.AchievementEntityBuilder achievementEntity = AchievementEntity.builder();

        achievementEntity.description( domain.getDescription() );
        achievementEntity.icon( domain.getIcon() );
        achievementEntity.id( domain.getId() );
        achievementEntity.name( domain.getName() );
        achievementEntity.unlocked( domain.isUnlocked() );
        achievementEntity.unlockedAt( domain.getUnlockedAt() );

        achievementEntity.type( domain.getType() != null ? domain.getType().name() : null );

        return achievementEntity.build();
    }
}
