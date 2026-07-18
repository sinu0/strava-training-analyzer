package pl.strava.analizator.infrastructure.persistence.adapter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;
import pl.strava.analizator.infrastructure.persistence.entity.DailyMetricValueEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.DailyMetricValueJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.DailyMetricValueEntityMapper;

@Component
@RequiredArgsConstructor
public class DailyMetricRepositoryAdapter implements DailyMetricRepository {

    private final DailyMetricValueJpaRepository jpaRepository;
    private final DailyMetricValueEntityMapper mapper;

    @Override
    @Transactional
    public void save(LocalDate date, MetricResult result) {
        Optional<DailyMetricValueEntity> existing =
                jpaRepository.findByDateAndMetricName(date, result.getMetricName());

        DailyMetricValueEntity entity;
        if (existing.isPresent()) {
            entity = existing.get();
            entity.setValueNumeric(result.getNumericValue());
            entity.setValueJson(result.getJsonValue());
            entity.setCalculatorVersion(result.getCalculatorVersion());
            entity.setInputFingerprint(result.getInputFingerprint());
            entity.setAsOf(result.getAsOf() != null ? result.getAsOf() : date);
            entity.setCalculatedAt(result.getCalculatedAt());
        } else {
            entity = mapper.toEntity(result);
            entity.setDate(date);
            if (entity.getAsOf() == null) entity.setAsOf(date);
        }
        jpaRepository.save(entity);
    }

    @Override
    @Transactional
    public void saveAll(LocalDate date, List<MetricResult> results) {
        results.forEach(result -> save(date, result));
    }

    @Override
    public Optional<BigDecimal> findNumericValue(LocalDate date, String metricName) {
        return jpaRepository.findByDateAndMetricName(date, metricName)
                .map(DailyMetricValueEntity::getValueNumeric);
    }

    @Override
    public Optional<Map<String, Object>> findJsonValue(LocalDate date, String metricName) {
        return jpaRepository.findByDateAndMetricName(date, metricName)
                .map(DailyMetricValueEntity::getValueJson);
    }

    @Override
    public Map<LocalDate, BigDecimal> findNumericSeries(String metricName, DateRange range) {
        List<DailyMetricValueEntity> entities =
                jpaRepository.findByMetricNameAndDateBetweenOrderByDateAsc(
                        metricName, range.getFrom(), range.getTo());

        Map<LocalDate, BigDecimal> result = new LinkedHashMap<>();
        for (DailyMetricValueEntity entity : entities) {
            if (entity.getValueNumeric() != null) {
                result.put(entity.getDate(), entity.getValueNumeric());
            }
        }
        return result;
    }

    @Override
    public List<MetricResult> findAllByDate(LocalDate date) {
        return jpaRepository.findByDate(date)
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    @Transactional
    public void deleteAll() {
        jpaRepository.deleteAllInBatch();
    }
}
