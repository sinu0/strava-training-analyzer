package pl.strava.analizator.application.dto;

import java.util.List;

public record ActivityHeatmapRouteDto(List<List<Double>> coordinates) {
}
