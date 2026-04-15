package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.WeatherLocationEntity;

@Repository
public interface WeatherLocationJpaRepository extends JpaRepository<WeatherLocationEntity, UUID> {

    Optional<WeatherLocationEntity> findByName(String name);

    Optional<WeatherLocationEntity> findByActiveTrue();

    List<WeatherLocationEntity> findAllByOrderByNameAsc();

    @Modifying
    @Query("UPDATE WeatherLocationEntity e SET e.active = false WHERE e.active = true")
    void deactivateAll();
}
