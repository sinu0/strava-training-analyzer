package pl.strava.analizator.infrastructure.persistence.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.infrastructure.persistence.entity.AthleteProfileEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class AthleteProfileEntityMapperImpl implements AthleteProfileEntityMapper {

    @Override
    public AthleteProfile toDomain(AthleteProfileEntity entity) {
        if ( entity == null ) {
            return null;
        }

        AthleteProfile.AthleteProfileBuilder athleteProfile = AthleteProfile.builder();

        athleteProfile.createdAt( entity.getCreatedAt() );
        athleteProfile.dateOfBirth( entity.getDateOfBirth() );
        athleteProfile.email( entity.getEmail() );
        athleteProfile.ftpWatts( entity.getFtpWatts() );
        athleteProfile.garminToken( entity.getGarminToken() );
        athleteProfile.garminUserId( entity.getGarminUserId() );
        athleteProfile.id( entity.getId() );
        athleteProfile.lthrBpm( entity.getLthrBpm() );
        athleteProfile.maxHrBpm( entity.getMaxHrBpm() );
        athleteProfile.name( entity.getName() );
        athleteProfile.restingHrBpm( entity.getRestingHrBpm() );
        athleteProfile.stravaAccessToken( entity.getStravaAccessToken() );
        athleteProfile.stravaAthleteId( entity.getStravaAthleteId() );
        athleteProfile.stravaRefreshToken( entity.getStravaRefreshToken() );
        athleteProfile.stravaTokenExpires( entity.getStravaTokenExpires() );
        athleteProfile.updatedAt( entity.getUpdatedAt() );
        athleteProfile.weightKg( entity.getWeightKg() );

        return athleteProfile.build();
    }

    @Override
    public AthleteProfileEntity toEntity(AthleteProfile domain) {
        if ( domain == null ) {
            return null;
        }

        AthleteProfileEntity.AthleteProfileEntityBuilder athleteProfileEntity = AthleteProfileEntity.builder();

        athleteProfileEntity.createdAt( domain.getCreatedAt() );
        athleteProfileEntity.dateOfBirth( domain.getDateOfBirth() );
        athleteProfileEntity.email( domain.getEmail() );
        athleteProfileEntity.ftpWatts( domain.getFtpWatts() );
        athleteProfileEntity.garminToken( domain.getGarminToken() );
        athleteProfileEntity.garminUserId( domain.getGarminUserId() );
        athleteProfileEntity.id( domain.getId() );
        athleteProfileEntity.lthrBpm( domain.getLthrBpm() );
        athleteProfileEntity.maxHrBpm( domain.getMaxHrBpm() );
        athleteProfileEntity.name( domain.getName() );
        athleteProfileEntity.restingHrBpm( domain.getRestingHrBpm() );
        athleteProfileEntity.stravaAccessToken( domain.getStravaAccessToken() );
        athleteProfileEntity.stravaAthleteId( domain.getStravaAthleteId() );
        athleteProfileEntity.stravaRefreshToken( domain.getStravaRefreshToken() );
        athleteProfileEntity.stravaTokenExpires( domain.getStravaTokenExpires() );
        athleteProfileEntity.updatedAt( domain.getUpdatedAt() );
        athleteProfileEntity.weightKg( domain.getWeightKg() );

        return athleteProfileEntity.build();
    }
}
