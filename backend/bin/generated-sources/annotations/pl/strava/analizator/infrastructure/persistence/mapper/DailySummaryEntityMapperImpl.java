package pl.strava.analizator.infrastructure.persistence.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.infrastructure.persistence.entity.DailySummaryEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class DailySummaryEntityMapperImpl implements DailySummaryEntityMapper {

    @Override
    public DailySummary toDomain(DailySummaryEntity entity) {
        if ( entity == null ) {
            return null;
        }

        DailySummary.DailySummaryBuilder dailySummary = DailySummary.builder();

        dailySummary.activeCalories( entity.getActiveCalories() );
        dailySummary.activitiesCount( entity.getActivitiesCount() );
        dailySummary.awakeSleepSeconds( entity.getAwakeSleepSeconds() );
        dailySummary.bodyBattery( entity.getBodyBattery() );
        dailySummary.checkInLegFreshness( entity.getCheckInLegFreshness() );
        dailySummary.checkInMotivation( entity.getCheckInMotivation() );
        dailySummary.checkInSleepQuality( entity.getCheckInSleepQuality() );
        dailySummary.checkInSoreness( entity.getCheckInSoreness() );
        dailySummary.checkInUpdatedAt( entity.getCheckInUpdatedAt() );
        dailySummary.createdAt( entity.getCreatedAt() );
        dailySummary.date( entity.getDate() );
        dailySummary.deepSleepSeconds( entity.getDeepSleepSeconds() );
        dailySummary.garminSyncedAt( entity.getGarminSyncedAt() );
        dailySummary.hrvRmssd( entity.getHrvRmssd() );
        dailySummary.id( entity.getId() );
        dailySummary.lightSleepSeconds( entity.getLightSleepSeconds() );
        dailySummary.remSleepSeconds( entity.getRemSleepSeconds() );
        dailySummary.restingHrBpm( entity.getRestingHrBpm() );
        dailySummary.sleepDurationSeconds( entity.getSleepDurationSeconds() );
        dailySummary.sleepScore( entity.getSleepScore() );
        dailySummary.steps( entity.getSteps() );
        dailySummary.stressAvg( entity.getStressAvg() );
        dailySummary.totalDistanceM( entity.getTotalDistanceM() );
        dailySummary.totalElevationM( entity.getTotalElevationM() );
        dailySummary.totalTimeSec( entity.getTotalTimeSec() );
        dailySummary.updatedAt( entity.getUpdatedAt() );

        return dailySummary.build();
    }

    @Override
    public DailySummaryEntity toEntity(DailySummary domain) {
        if ( domain == null ) {
            return null;
        }

        DailySummaryEntity.DailySummaryEntityBuilder dailySummaryEntity = DailySummaryEntity.builder();

        dailySummaryEntity.activeCalories( domain.getActiveCalories() );
        dailySummaryEntity.activitiesCount( domain.getActivitiesCount() );
        dailySummaryEntity.awakeSleepSeconds( domain.getAwakeSleepSeconds() );
        dailySummaryEntity.bodyBattery( domain.getBodyBattery() );
        dailySummaryEntity.checkInLegFreshness( domain.getCheckInLegFreshness() );
        dailySummaryEntity.checkInMotivation( domain.getCheckInMotivation() );
        dailySummaryEntity.checkInSleepQuality( domain.getCheckInSleepQuality() );
        dailySummaryEntity.checkInSoreness( domain.getCheckInSoreness() );
        dailySummaryEntity.checkInUpdatedAt( domain.getCheckInUpdatedAt() );
        dailySummaryEntity.createdAt( domain.getCreatedAt() );
        dailySummaryEntity.date( domain.getDate() );
        dailySummaryEntity.deepSleepSeconds( domain.getDeepSleepSeconds() );
        dailySummaryEntity.garminSyncedAt( domain.getGarminSyncedAt() );
        dailySummaryEntity.hrvRmssd( domain.getHrvRmssd() );
        dailySummaryEntity.id( domain.getId() );
        dailySummaryEntity.lightSleepSeconds( domain.getLightSleepSeconds() );
        dailySummaryEntity.remSleepSeconds( domain.getRemSleepSeconds() );
        dailySummaryEntity.restingHrBpm( domain.getRestingHrBpm() );
        dailySummaryEntity.sleepDurationSeconds( domain.getSleepDurationSeconds() );
        dailySummaryEntity.sleepScore( domain.getSleepScore() );
        dailySummaryEntity.steps( domain.getSteps() );
        dailySummaryEntity.stressAvg( domain.getStressAvg() );
        dailySummaryEntity.totalDistanceM( domain.getTotalDistanceM() );
        dailySummaryEntity.totalElevationM( domain.getTotalElevationM() );
        dailySummaryEntity.totalTimeSec( domain.getTotalTimeSec() );
        dailySummaryEntity.updatedAt( domain.getUpdatedAt() );

        return dailySummaryEntity.build();
    }
}
