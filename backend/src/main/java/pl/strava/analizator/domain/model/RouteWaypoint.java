package pl.strava.analizator.domain.model;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

@Getter
@Builder
@AllArgsConstructor
@Jacksonized
public class RouteWaypoint {
    private int index;
    private double lat;
    private double lng;
    private BigDecimal elevationM;
    private String label;
}
