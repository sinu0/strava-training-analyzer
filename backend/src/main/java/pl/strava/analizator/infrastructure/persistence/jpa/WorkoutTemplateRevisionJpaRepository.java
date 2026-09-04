package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.WorkoutTemplateRevisionEntity;

@Repository
public interface WorkoutTemplateRevisionJpaRepository
        extends JpaRepository<WorkoutTemplateRevisionEntity, UUID> {
    boolean existsByTemplateIdAndRevision(UUID templateId, int revision);
    Optional<WorkoutTemplateRevisionEntity> findByTemplateIdAndRevision(UUID templateId, int revision);
}
