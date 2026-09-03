package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class RouteFingerprint {

    private UUID activityId;
    private int algorithmVersion;
    private String capability;
    private String exactHash;
    private String reverseHash;
    private String fuzzyKey;
    private String normalizedPolyline;
    private Double distanceM;
    private Double centerLatitude;
    private Double centerLongitude;
    private Instant computedAt;
}
