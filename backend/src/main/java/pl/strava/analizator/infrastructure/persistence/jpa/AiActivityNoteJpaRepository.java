package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.AiActivityNoteEntity;

public interface AiActivityNoteJpaRepository extends JpaRepository<AiActivityNoteEntity, UUID> {

    Optional<AiActivityNoteEntity> findByActivityId(UUID activityId);

    void deleteByActivityId(UUID activityId);
}
