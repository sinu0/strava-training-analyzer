package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class MatchedRoute {

    private UUID id;
    private UUID routeGroupId;
    private UUID activityId;
    private UUID matchedToActivityId;
    private BigDecimal similarityPercent;
    private boolean exactMatch;
    private String directionVariant;
    private int algorithmVersion;
    private Instant createdAt;
}
