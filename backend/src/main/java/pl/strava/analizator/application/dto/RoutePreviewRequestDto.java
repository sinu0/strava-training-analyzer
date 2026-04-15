package pl.strava.analizator.application.dto;

import java.util.List;

import pl.strava.analizator.domain.model.RoutePlanningPreferences;

public record RoutePreviewRequestDto(
        List<double[]> waypoints,
        RoutePlanningPreferences preferences
) {
}
