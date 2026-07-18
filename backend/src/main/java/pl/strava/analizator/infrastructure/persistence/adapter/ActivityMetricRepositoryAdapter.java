package pl.strava.analizator.infrastructure.persistence.adapter;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityMetricEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityMetricJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.ActivityMetricEntityMapper;

@Component
@RequiredArgsConstructor
public class ActivityMetricRepositoryAdapter implements ActivityMetricRepository {

    private final ActivityMetricJpaRepository jpaRepository;
    private final ActivityMetricEntityMapper mapper;

    @Override
    @Transactional
    public void save(UUID activityId, MetricResult result) {
        Optional<ActivityMetricEntity> existing =
                jpaRepository.findByActivityIdAndMetricName(activityId, result.getMetricName());

        ActivityMetricEntity entity;
        if (existing.isPresent()) {
            entity = existing.get();
            entity.setValueNumeric(result.getNumericValue());
            entity.setValueJson(result.getJsonValue());
            entity.setCalculatorVersion(result.getCalculatorVersion());
            entity.setInputFingerprint(result.getInputFingerprint());
            entity.setAsOf(result.getAsOf());
            entity.setCalculatedAt(result.getCalculatedAt());
        } else {
            entity = mapper.toEntity(result);
            entity.setActivityId(activityId);
        }
        jpaRepository.save(entity);
    }

    @Override
    @Transactional
    public void saveAll(UUID activityId, List<MetricResult> results) {
        results.forEach(result -> save(activityId, result));
    }

    @Override
    public Optional<BigDecimal> findNumericValue(UUID activityId, String metricName) {
        return jpaRepository.findByActivityIdAndMetricName(activityId, metricName)
                .map(ActivityMetricEntity::getValueNumeric);
    }

    @Override
    public Map<UUID, BigDecimal> findNumericValues(List<UUID> activityIds, String metricName) {
        if (activityIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, BigDecimal> result = new HashMap<>();
        for (ActivityMetricEntity e : jpaRepository.findByActivityIdInAndMetricName(activityIds, metricName)) {
            if (e.getValueNumeric() != null) {
                result.put(e.getActivityId(), e.getValueNumeric());
            }
        }
        return result;
    }

    @Override
    public Optional<Map<String, Object>> findJsonValue(UUID activityId, String metricName) {
        return jpaRepository.findByActivityIdAndMetricName(activityId, metricName)
                .map(ActivityMetricEntity::getValueJson);
    }

    @Override
    public List<MetricResult> findAllByActivityId(UUID activityId) {
        return jpaRepository.findByActivityId(activityId)
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    @Transactional
    public void deleteByActivityIdAndMetricName(UUID activityId, String metricName) {
        jpaRepository.deleteByActivityIdAndMetricName(activityId, metricName);
    }

    @Override
    @Transactional
    public void deleteAll() {
        jpaRepository.deleteAllInBatch();
    }
}
