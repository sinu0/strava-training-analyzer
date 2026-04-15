package pl.strava.analizator.application.dto;

import java.util.List;

public record ActivityHeatmapDto(
        List<HeatmapSegmentDto> segments,
        int routeCount,
        ActivityHeatmapBoundsDto bounds,
        double totalDistanceKm,
        int maxCount,
        String status) {
}
