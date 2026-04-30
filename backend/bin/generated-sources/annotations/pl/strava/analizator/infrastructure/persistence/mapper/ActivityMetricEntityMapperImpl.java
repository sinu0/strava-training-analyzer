package pl.strava.analizator.infrastructure.persistence.mapper;

import java.util.LinkedHashMap;
import java.util.Map;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityMetricEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ActivityMetricEntityMapperImpl implements ActivityMetricEntityMapper {

    @Override
    public MetricResult toDomain(ActivityMetricEntity entity) {
        if ( entity == null ) {
            return null;
        }

        MetricResult.MetricResultBuilder metricResult = MetricResult.builder();

        metricResult.numericValue( entity.getValueNumeric() );
        Map<String, Object> map = entity.getValueJson();
        if ( map != null ) {
            metricResult.jsonValue( new LinkedHashMap<String, Object>( map ) );
        }
        metricResult.calculatedAt( entity.getCalculatedAt() );
        metricResult.calculatorVersion( entity.getCalculatorVersion() );
        metricResult.metricName( entity.getMetricName() );

        return metricResult.build();
    }

    @Override
    public ActivityMetricEntity toEntity(MetricResult domain) {
        if ( domain == null ) {
            return null;
        }

        ActivityMetricEntity.ActivityMetricEntityBuilder activityMetricEntity = ActivityMetricEntity.builder();

        activityMetricEntity.valueNumeric( domain.getNumericValue() );
        Map<String, Object> map = domain.getJsonValue();
        if ( map != null ) {
            activityMetricEntity.valueJson( new LinkedHashMap<String, Object>( map ) );
        }
        activityMetricEntity.calculatedAt( domain.getCalculatedAt() );
        activityMetricEntity.calculatorVersion( domain.getCalculatorVersion() );
        activityMetricEntity.metricName( domain.getMetricName() );

        return activityMetricEntity.build();
    }
}
