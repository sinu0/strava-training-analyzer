package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class RouteGroup {

    private UUID id;
    private UUID familyId;
    private UUID canonicalActivityId;
    private String directionKey;
    private int algorithmVersion;
    private Instant createdAt;
    private Instant updatedAt;
}
