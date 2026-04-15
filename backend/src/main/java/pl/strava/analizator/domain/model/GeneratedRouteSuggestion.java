package pl.strava.analizator.domain.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GeneratedRouteSuggestion {
    private List<double[]> waypoints;
    private RoutePreview preview;
    private String sourceName;
    private String sourceType;
    private String strategy;
    private String style;
    private Long seed;
}
