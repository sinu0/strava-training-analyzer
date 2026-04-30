package pl.strava.analizator.infrastructure.persistence.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.WeightGoal;
import pl.strava.analizator.domain.model.WeightRecord;
import pl.strava.analizator.infrastructure.persistence.entity.WeightGoalEntity;
import pl.strava.analizator.infrastructure.persistence.entity.WeightHistoryEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class WeightEntityMapperImpl implements WeightEntityMapper {

    @Override
    public WeightRecord toDomain(WeightHistoryEntity entity) {
        if ( entity == null ) {
            return null;
        }

        WeightRecord.WeightRecordBuilder weightRecord = WeightRecord.builder();

        weightRecord.createdAt( entity.getCreatedAt() );
        weightRecord.id( entity.getId() );
        weightRecord.notes( entity.getNotes() );
        weightRecord.recordedDate( entity.getRecordedDate() );
        weightRecord.weightKg( entity.getWeightKg() );

        return weightRecord.build();
    }

    @Override
    public WeightHistoryEntity toEntity(WeightRecord domain) {
        if ( domain == null ) {
            return null;
        }

        WeightHistoryEntity.WeightHistoryEntityBuilder weightHistoryEntity = WeightHistoryEntity.builder();

        weightHistoryEntity.createdAt( domain.getCreatedAt() );
        weightHistoryEntity.id( domain.getId() );
        weightHistoryEntity.notes( domain.getNotes() );
        weightHistoryEntity.recordedDate( domain.getRecordedDate() );
        weightHistoryEntity.weightKg( domain.getWeightKg() );

        return weightHistoryEntity.build();
    }

    @Override
    public WeightGoal toGoalDomain(WeightGoalEntity entity) {
        if ( entity == null ) {
            return null;
        }

        WeightGoal.WeightGoalBuilder weightGoal = WeightGoal.builder();

        weightGoal.createdAt( entity.getCreatedAt() );
        weightGoal.id( entity.getId() );
        weightGoal.targetDate( entity.getTargetDate() );
        weightGoal.targetWeightKg( entity.getTargetWeightKg() );
        weightGoal.updatedAt( entity.getUpdatedAt() );

        return weightGoal.build();
    }

    @Override
    public WeightGoalEntity toGoalEntity(WeightGoal domain) {
        if ( domain == null ) {
            return null;
        }

        WeightGoalEntity.WeightGoalEntityBuilder weightGoalEntity = WeightGoalEntity.builder();

        weightGoalEntity.createdAt( domain.getCreatedAt() );
        weightGoalEntity.id( domain.getId() );
        weightGoalEntity.targetDate( domain.getTargetDate() );
        weightGoalEntity.targetWeightKg( domain.getTargetWeightKg() );
        weightGoalEntity.updatedAt( domain.getUpdatedAt() );

        return weightGoalEntity.build();
    }
}
