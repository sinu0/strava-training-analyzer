package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.WorkoutTemplateEntity;

@Repository
public interface WorkoutTemplateJpaRepository extends JpaRepository<WorkoutTemplateEntity, UUID> {
    List<WorkoutTemplateEntity> findByCategory(String category);
}
