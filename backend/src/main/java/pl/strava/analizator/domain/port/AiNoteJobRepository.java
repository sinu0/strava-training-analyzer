package pl.strava.analizator.domain.port;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.ai.AiNoteJob;

public interface AiNoteJobRepository {

    AiNoteJob save(AiNoteJob job);

    Optional<AiNoteJob> findNextPending(Instant readyAt);

    List<AiNoteJob> findStaleProcessing(Instant startedBefore);

    Optional<AiNoteJob> findByActivityId(UUID activityId);

    List<AiNoteJob> findByStatus(String status);

    void deleteByActivityId(UUID activityId);
}
