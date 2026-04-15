package pl.strava.analizator.domain.port;

import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.ai.AiActivityNote;

public interface AiActivityNoteRepository {

    AiActivityNote save(AiActivityNote note);

    Optional<AiActivityNote> findByActivityId(UUID activityId);

    void deleteByActivityId(UUID activityId);
}
