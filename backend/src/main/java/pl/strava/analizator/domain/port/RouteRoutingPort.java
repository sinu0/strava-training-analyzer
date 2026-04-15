package pl.strava.analizator.domain.port;

import java.util.List;

import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;

public interface RouteRoutingPort {
    RoutePreview calculateRoute(List<double[]> waypoints, RoutePlanningPreferences preferences);
}
