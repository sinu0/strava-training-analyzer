package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.AthleteProfileEntity;

@Repository
public interface AthleteProfileJpaRepository extends JpaRepository<AthleteProfileEntity, UUID> {

    @Query(value = """
            SELECT *
            FROM athlete_profile
            ORDER BY CASE WHEN strava_athlete_id IS NOT NULL THEN 0 ELSE 1 END ASC,
                     COALESCE(updated_at, created_at) DESC,
                     created_at ASC
            LIMIT 1
            """, nativeQuery = true)
    Optional<AthleteProfileEntity> findFirst();

    Optional<AthleteProfileEntity> findByStravaAthleteId(Long stravaAthleteId);
}
