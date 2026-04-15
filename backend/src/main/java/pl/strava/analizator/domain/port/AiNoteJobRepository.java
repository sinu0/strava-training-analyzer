package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.ai.AiNoteJob;

public interface AiNoteJobRepository {

    AiNoteJob save(AiNoteJob job);

    Optional<AiNoteJob> findNextPending();

    Optional<AiNoteJob> findByActivityId(UUID activityId);

    List<AiNoteJob> findByStatus(String status);

    void deleteByActivityId(UUID activityId);
}
