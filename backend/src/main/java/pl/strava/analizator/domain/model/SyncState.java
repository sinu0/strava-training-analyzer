package pl.strava.analizator.domain.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SyncState {
    private Long id;
    private String status;
    private Instant lastSyncAt;
    private int importedTotal;
    private int skippedTotal;
    private Instant rateLimitResetsAt;
    private Instant updatedAt;
}
