package pl.strava.analizator.infrastructure.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.RouteGeneratorService;
import pl.strava.analizator.application.dto.GeneratedRouteSuggestionDto;
import pl.strava.analizator.application.RoutePlannerService;
import pl.strava.analizator.application.dto.RouteGenerationRequestDto;
import pl.strava.analizator.application.dto.RoutePreviewDto;
import pl.strava.analizator.application.dto.RoutePreviewRequestDto;
import pl.strava.analizator.domain.model.PlannedRoute;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RoutePlannerController {

    private final RoutePlannerService routePlannerService;
    private final RouteGeneratorService routeGeneratorService;

    @PostMapping
    public ResponseEntity<PlannedRoute> createRoute(@RequestBody RoutePlannerService.CreateRouteRequest request) {
        return ResponseEntity.ok(routePlannerService.createRoute(request));
    }

    @PostMapping("/preview")
    public ResponseEntity<RoutePreviewDto> previewRoute(@RequestBody RoutePreviewRequestDto request) {
        return ResponseEntity.ok(RoutePreviewDto.from(
                routePlannerService.previewRoute(request.waypoints(), request.preferences())));
    }

    @PostMapping("/generate")
    public ResponseEntity<GeneratedRouteSuggestionDto> generateRoute(@RequestBody RouteGenerationRequestDto request) {
        return ResponseEntity.ok(GeneratedRouteSuggestionDto.from(
                routeGeneratorService.generateHistoricalRoute(request)));
    }

    @PostMapping("/generate/alternatives")
    public ResponseEntity<List<GeneratedRouteSuggestionDto>> generateRouteAlternatives(@RequestBody RouteGenerationRequestDto request) {
        return ResponseEntity.ok(routeGeneratorService.generateHistoricalRouteAlternatives(request).stream()
                .map(GeneratedRouteSuggestionDto::from)
                .toList());
    }

    @PostMapping("/generate/persist")
    public ResponseEntity<PlannedRoute> generateAndPersist(@RequestBody RouteGenerationRequestDto request) {
        var suggestion = routeGeneratorService.generateHistoricalRoute(request);
        var preview = suggestion.getPreview();

        List<pl.strava.analizator.domain.model.RouteWaypoint> waypoints = new java.util.ArrayList<>();
        int idx = 0;
        if (suggestion.getWaypoints() != null) {
            for (double[] wp : suggestion.getWaypoints()) {
                pl.strava.analizator.domain.model.RouteWaypoint rw = pl.strava.analizator.domain.model.RouteWaypoint.builder()
                        .index(idx)
                        .lat(wp[0])
                        .lng(wp[1])
                        .elevationM(null)
                        .label(null)
                        .build();
                waypoints.add(rw);
                idx++;
            }
        }

        var createReq = new pl.strava.analizator.application.RoutePlannerService.CreateRouteRequest(
                "Sugestia trasy: " + (suggestion.getSourceName() == null ? "generowana" : suggestion.getSourceName()),
                suggestion.getStrategy(),
                waypoints,
                preview == null ? List.of() : preview.getPolyline(),
                List.of());

        PlannedRoute saved = routePlannerService.createRoute(createReq);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<PlannedRoute>> listRoutes() {
        return ResponseEntity.ok(routePlannerService.listRoutes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlannedRoute> getRoute(@PathVariable UUID id) {
        return ResponseEntity.ok(routePlannerService.getRoute(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable UUID id) {
        routePlannerService.deleteRoute(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/gpx")
    public ResponseEntity<String> exportGpx(@PathVariable UUID id) {
        String gpx = routePlannerService.exportGpx(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"route.gpx\"")
                .contentType(MediaType.APPLICATION_XML)
                .body(gpx);
    }
}
