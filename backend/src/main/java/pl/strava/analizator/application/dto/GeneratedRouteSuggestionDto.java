package pl.strava.analizator.application.dto;

import java.util.List;

import pl.strava.analizator.domain.model.GeneratedRouteSuggestion;

public record GeneratedRouteSuggestionDto(
        List<double[]> waypoints,
        RoutePreviewDto preview,
        String sourceName,
        String sourceType,
        String strategy,
        String style,
        Long seed
) {
    public static GeneratedRouteSuggestionDto from(GeneratedRouteSuggestion suggestion) {
        return new GeneratedRouteSuggestionDto(
                suggestion.getWaypoints(),
                RoutePreviewDto.from(suggestion.getPreview()),
                suggestion.getSourceName(),
                suggestion.getSourceType(),
                suggestion.getStrategy(),
                suggestion.getStyle(),
                suggestion.getSeed());
    }
}
