package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class PlannedRoute {
    private UUID id;
    private String name;
    private String description;
    private List<RouteWaypoint> waypoints;
    private List<double[]> polyline;
    private BigDecimal totalDistanceM;
    private BigDecimal totalElevationGainM;
    private BigDecimal totalElevationLossM;
    private Integer estimatedTimeSec;
    private Integer estimatedTss;
    private Instant createdAt;
    private Instant updatedAt;
}
