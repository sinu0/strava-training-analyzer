package pl.strava.analizator.infrastructure.persistence.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ActivityEntityMapperImpl implements ActivityEntityMapper {

    @Override
    public Activity toDomain(ActivityEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Activity.ActivityBuilder activity = Activity.builder();

        activity.powerStream( extractPowerStream( entity.getStreams() ) );
        activity.heartrateStream( extractHeartrateStream( entity.getStreams() ) );
        activity.cadenceStream( extractCadenceStream( entity.getStreams() ) );
        activity.altitudeStream( extractAltitudeStream( entity.getStreams() ) );
        activity.timeStream( extractTimeStream( entity.getStreams() ) );
        activity.latStream( extractLatStream( entity.getStreams() ) );
        activity.lngStream( extractLngStream( entity.getStreams() ) );
        activity.distanceStream( extractDistanceStream( entity.getStreams() ) );
        activity.velocityStream( extractVelocityStream( entity.getStreams() ) );
        activity.tags( arrayToList( entity.getTags() ) );
        activity.laps( mapsToLaps( entity.getLaps() ) );
        activity.avgCadence( entity.getAvgCadence() );
        activity.avgHeartrate( entity.getAvgHeartrate() );
        activity.avgPowerW( entity.getAvgPowerW() );
        activity.avgSpeedMs( entity.getAvgSpeedMs() );
        activity.avgTempC( entity.getAvgTempC() );
        activity.calories( entity.getCalories() );
        activity.createdAt( entity.getCreatedAt() );
        activity.description( entity.getDescription() );
        activity.distanceM( entity.getDistanceM() );
        activity.elapsedTimeSec( entity.getElapsedTimeSec() );
        activity.elevationGainM( entity.getElevationGainM() );
        activity.elevationLossM( entity.getElevationLossM() );
        activity.externalId( entity.getExternalId() );
        activity.gearId( entity.getGearId() );
        activity.id( entity.getId() );
        activity.maxCadence( entity.getMaxCadence() );
        activity.maxHeartrate( entity.getMaxHeartrate() );
        activity.maxPowerW( entity.getMaxPowerW() );
        activity.maxSpeedMs( entity.getMaxSpeedMs() );
        activity.movingTimeSec( entity.getMovingTimeSec() );
        activity.name( entity.getName() );
        List<String> list2 = entity.getPhotoUrls();
        if ( list2 != null ) {
            activity.photoUrls( new ArrayList<String>( list2 ) );
        }
        activity.source( entity.getSource() );
        activity.sportType( entity.getSportType() );
        activity.startedAt( entity.getStartedAt() );
        activity.summaryPolyline( entity.getSummaryPolyline() );
        activity.updatedAt( entity.getUpdatedAt() );

        return activity.build();
    }

    @Override
    public ActivityEntity toEntity(Activity domain) {
        if ( domain == null ) {
            return null;
        }

        ActivityEntity.ActivityEntityBuilder activityEntity = ActivityEntity.builder();

        activityEntity.streams( buildStreamsJson( domain ) );
        activityEntity.laps( lapsToMaps( domain.getLaps() ) );
        activityEntity.tags( listToArray( domain.getTags() ) );
        activityEntity.avgCadence( domain.getAvgCadence() );
        activityEntity.avgHeartrate( domain.getAvgHeartrate() );
        activityEntity.avgPowerW( domain.getAvgPowerW() );
        activityEntity.avgSpeedMs( domain.getAvgSpeedMs() );
        activityEntity.avgTempC( domain.getAvgTempC() );
        activityEntity.calories( domain.getCalories() );
        activityEntity.createdAt( domain.getCreatedAt() );
        activityEntity.description( domain.getDescription() );
        activityEntity.distanceM( domain.getDistanceM() );
        activityEntity.elapsedTimeSec( domain.getElapsedTimeSec() );
        activityEntity.elevationGainM( domain.getElevationGainM() );
        activityEntity.elevationLossM( domain.getElevationLossM() );
        activityEntity.externalId( domain.getExternalId() );
        activityEntity.gearId( domain.getGearId() );
        activityEntity.id( domain.getId() );
        activityEntity.maxCadence( domain.getMaxCadence() );
        activityEntity.maxHeartrate( domain.getMaxHeartrate() );
        activityEntity.maxPowerW( domain.getMaxPowerW() );
        activityEntity.maxSpeedMs( domain.getMaxSpeedMs() );
        activityEntity.movingTimeSec( domain.getMovingTimeSec() );
        activityEntity.name( domain.getName() );
        List<String> list1 = domain.getPhotoUrls();
        if ( list1 != null ) {
            activityEntity.photoUrls( new ArrayList<String>( list1 ) );
        }
        activityEntity.source( domain.getSource() );
        activityEntity.sportType( domain.getSportType() );
        activityEntity.startedAt( domain.getStartedAt() );
        activityEntity.summaryPolyline( domain.getSummaryPolyline() );
        activityEntity.updatedAt( domain.getUpdatedAt() );

        return activityEntity.build();
    }
}
