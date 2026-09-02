package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.AiNoteJobEntity;

public interface AiNoteJobJpaRepository extends JpaRepository<AiNoteJobEntity, UUID> {

    Optional<AiNoteJobEntity> findFirstByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            String status, Instant readyAt);

    List<AiNoteJobEntity> findByStatusAndStartedAtBefore(String status, Instant startedBefore);

    Optional<AiNoteJobEntity> findByActivityId(UUID activityId);

    List<AiNoteJobEntity> findByStatus(String status);

    void deleteByActivityId(UUID activityId);
}
