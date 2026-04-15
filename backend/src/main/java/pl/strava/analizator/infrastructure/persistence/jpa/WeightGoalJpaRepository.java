package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.WeightGoalEntity;

@Repository
public interface WeightGoalJpaRepository extends JpaRepository<WeightGoalEntity, UUID> {

    @Query(value = "SELECT * FROM weight_goal ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<WeightGoalEntity> findLatest();
}
