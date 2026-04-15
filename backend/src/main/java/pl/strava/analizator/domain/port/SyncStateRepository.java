package pl.strava.analizator.domain.port;

import pl.strava.analizator.domain.model.SyncState;
import java.util.Optional;

public interface SyncStateRepository {
    Optional<SyncState> findFirst();
    SyncState save(SyncState state);
}
