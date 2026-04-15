package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.TrainingPlanProgramEntity;

@Repository
public interface TrainingPlanProgramJpaRepository extends JpaRepository<TrainingPlanProgramEntity, UUID> {
}
