package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.DailyMetricValueEntity;

@Repository
public interface DailyMetricValueJpaRepository extends JpaRepository<DailyMetricValueEntity, UUID> {

    Optional<DailyMetricValueEntity> findByDateAndMetricName(LocalDate date, String metricName);

    List<DailyMetricValueEntity> findByDate(LocalDate date);

    List<DailyMetricValueEntity> findByMetricNameAndDateBetweenOrderByDateAsc(
            String metricName, LocalDate from, LocalDate to);
}
