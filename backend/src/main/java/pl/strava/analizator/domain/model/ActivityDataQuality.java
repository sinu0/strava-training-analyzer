package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
public class ActivityDataQuality {
    private UUID activityId;
    private String status;
    private List<String> issues;
    private Instant assessedAt;
}
