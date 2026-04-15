package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.WeatherCacheEntity;

@Repository
public interface WeatherCacheJpaRepository extends JpaRepository<WeatherCacheEntity, UUID> {

    List<WeatherCacheEntity> findByLocationNameAndForecastDateGreaterThanEqualOrderByForecastDateAsc(
            String locationName, LocalDate fromDate);

    @Query("SELECT DISTINCT e.locationName FROM WeatherCacheEntity e ORDER BY e.locationName")
    List<String> findDistinctLocationNames();

    @Modifying
    @Query("DELETE FROM WeatherCacheEntity e WHERE e.forecastDate < :cutoff")
    void deleteByForecastDateBefore(LocalDate cutoff);
}
