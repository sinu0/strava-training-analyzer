package pl.strava.analizator.infrastructure.persistence.mapper;

import java.util.LinkedHashMap;
import java.util.Map;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.infrastructure.persistence.entity.DailyMetricValueEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-30T23:35:49+0200",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class DailyMetricValueEntityMapperImpl implements DailyMetricValueEntityMapper {

    @Override
    public MetricResult toDomain(DailyMetricValueEntity entity) {
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
    public DailyMetricValueEntity toEntity(MetricResult domain) {
        if ( domain == null ) {
            return null;
        }

        DailyMetricValueEntity.DailyMetricValueEntityBuilder dailyMetricValueEntity = DailyMetricValueEntity.builder();

        dailyMetricValueEntity.valueNumeric( domain.getNumericValue() );
        Map<String, Object> map = domain.getJsonValue();
        if ( map != null ) {
            dailyMetricValueEntity.valueJson( new LinkedHashMap<String, Object>( map ) );
        }
        dailyMetricValueEntity.calculatedAt( domain.getCalculatedAt() );
        dailyMetricValueEntity.calculatorVersion( domain.getCalculatorVersion() );
        dailyMetricValueEntity.metricName( domain.getMetricName() );

        return dailyMetricValueEntity.build();
    }
}
