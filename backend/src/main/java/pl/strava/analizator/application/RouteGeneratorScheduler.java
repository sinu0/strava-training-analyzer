package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import pl.strava.analizator.domain.model.GeneratedRouteSuggestion;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.domain.model.RouteWaypoint;

@Service
public class RouteGeneratorScheduler {

    private static final Logger log = LoggerFactory.getLogger(RouteGeneratorScheduler.class);

    private final RouteGeneratorService generatorService;
    private final RoutePlannerService plannerService;
    private final int routesPerDay;
    private final int defaultDistanceKm;
    private final int defaultVariation;

    @Autowired
    public RouteGeneratorScheduler(RouteGeneratorService generatorService,
                                   RoutePlannerService plannerService,
                                   @Value("${routes.generator.routes-per-day:2}") int routesPerDay,
                                   @Value("${routes.generator.target-distance-km:40}") int defaultDistanceKm,
                                   @Value("${routes.generator.variation-level:35}") int defaultVariation) {
        this.generatorService = generatorService;
        this.plannerService = plannerService;
        this.routesPerDay = routesPerDay;
        this.defaultDistanceKm = defaultDistanceKm;
        this.defaultVariation = defaultVariation;
    }

    // Constructor useful for unit tests (uses boxed Integer types to avoid duplicate signature)
    public RouteGeneratorScheduler(RouteGeneratorService generatorService,
                                   RoutePlannerService plannerService,
                                   Integer routesPerDay,
                                   Integer defaultDistanceKm,
                                   Integer defaultVariation) {
        this.generatorService = generatorService;
        this.plannerService = plannerService;
        this.routesPerDay = routesPerDay == null ? 2 : routesPerDay;
        this.defaultDistanceKm = defaultDistanceKm == null ? 40 : defaultDistanceKm;
        this.defaultVariation = defaultVariation == null ? 35 : defaultVariation;
    }

    @Scheduled(cron = "${routes.generator.cron:0 30 4 * * *}")
    public void runScheduledGeneration() {
        log.info("Starting scheduled route generation ({} routes/day)", routesPerDay);
        for (int i = 0; i < routesPerDay; i++) {
            try {
                var request = new pl.strava.analizator.application.dto.RouteGenerationRequestDto(
                        null,
                        defaultDistanceKm,
                        "balanced",
                        defaultVariation,
                        System.currentTimeMillis() + i,
                        null);

                GeneratedRouteSuggestion suggestion = generatorService.generateHistoricalRoute(request);
                if (suggestion == null) {
                    log.debug("Generator returned no suggestion for iteration {}", i);
                    continue;
                }

                RoutePreview preview = suggestion.getPreview();
                if (preview == null || preview.getPolyline() == null || preview.getPolyline().isEmpty()) {
                    log.debug("Suggestion has no valid preview polyline, skipping: {}", suggestion.getSourceName());
                    continue;
                }

                List<RouteWaypoint> waypoints = new ArrayList<>();
                int idx = 0;
                if (suggestion.getWaypoints() != null) {
                    for (double[] wp : suggestion.getWaypoints()) {
                        RouteWaypoint rw = RouteWaypoint.builder()
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

                var createReq = new RoutePlannerService.CreateRouteRequest(
                        "Sugestia trasy: " + (suggestion.getSourceName() == null ? "generowana" : suggestion.getSourceName()),
                        suggestion.getStrategy(),
                        waypoints,
                        preview.getPolyline(),
                        List.of());

                PlannedRoute saved = plannerService.createRoute(createReq);
                log.info("Persisted suggested route: {} (id={}) distance={}m", saved.getName(), saved.getId(), saved.getTotalDistanceM());

            } catch (Exception e) {
                log.error("Error while generating or saving suggested route", e);
            }
        }
        log.info("Completed scheduled route generation");
    }
}
