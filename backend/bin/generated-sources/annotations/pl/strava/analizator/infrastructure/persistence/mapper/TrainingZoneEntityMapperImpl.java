package pl.strava.analizator.infrastructure.persistence.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.TrainingZone;
import pl.strava.analizator.infrastructure.persistence.entity.TrainingZoneEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class TrainingZoneEntityMapperImpl implements TrainingZoneEntityMapper {

    @Override
    public TrainingZone toDomain(TrainingZoneEntity entity) {
        if ( entity == null ) {
            return null;
        }

        TrainingZone.TrainingZoneBuilder trainingZone = TrainingZone.builder();

        trainingZone.color( entity.getColor() );
        trainingZone.id( entity.getId() );
        trainingZone.maxValue( entity.getMaxValue() );
        trainingZone.minValue( entity.getMinValue() );
        trainingZone.validFrom( entity.getValidFrom() );
        trainingZone.validTo( entity.getValidTo() );
        trainingZone.zoneName( entity.getZoneName() );
        trainingZone.zoneNumber( entity.getZoneNumber() );
        trainingZone.zoneType( entity.getZoneType() );

        return trainingZone.build();
    }

    @Override
    public TrainingZoneEntity toEntity(TrainingZone domain) {
        if ( domain == null ) {
            return null;
        }

        TrainingZoneEntity.TrainingZoneEntityBuilder trainingZoneEntity = TrainingZoneEntity.builder();

        trainingZoneEntity.color( domain.getColor() );
        trainingZoneEntity.id( domain.getId() );
        trainingZoneEntity.maxValue( domain.getMaxValue() );
        trainingZoneEntity.minValue( domain.getMinValue() );
        trainingZoneEntity.validFrom( domain.getValidFrom() );
        trainingZoneEntity.validTo( domain.getValidTo() );
        trainingZoneEntity.zoneName( domain.getZoneName() );
        trainingZoneEntity.zoneNumber( domain.getZoneNumber() );
        trainingZoneEntity.zoneType( domain.getZoneType() );

        return trainingZoneEntity.build();
    }
}
