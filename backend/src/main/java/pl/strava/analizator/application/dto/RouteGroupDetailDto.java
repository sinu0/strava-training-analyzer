package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RouteGroupDetailDto {
    private UUID routeGroupId;
    private UUID routeFamilyId;
    private int algorithmVersion;
    private String directionKey;
    private int rideCount;
    private Double bestSpeedKmh;
    private Double averageSpeedKmh;
    private Double slowestSpeedKmh;
    private List<MatchedRidePointDto> rides;
}
