package pl.strava.analizator.infrastructure.routing;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;

class ExternalRouteRoutingAdapterTest {

    private RestTemplate restTemplate;
    private MockRestServiceServer server;
    private RoutingProperties properties;
    private ExternalRouteRoutingAdapter adapter;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate)
                .ignoreExpectOrder(true)
                .build();

        properties = new RoutingProperties();
        properties.getBrouter().setBaseUrl("https://routing.test/brouter");
        properties.getBrouter().setAlternativeCandidates(2);
        properties.getOsrm().setBaseUrl("https://routing.test/osrm");

        adapter = new ExternalRouteRoutingAdapter(restTemplate, properties);
    }

    @Test
    void calculateRoutePrefersBrouterAndParsesSurfaceStats() {
        server.expect(requestTo(allOf(containsString("profile=safety"), containsString("alternativeidx=0"))))
                .andExpect(method(GET))
                .andRespond(withSuccess(brouterResponse(1500, 80, 300, "safety", 0), MediaType.APPLICATION_JSON));

        RoutePreview preview = adapter.calculateRoute(sampleWaypoints(), RoutePlanningPreferences.defaults());

        assertThat(preview.getProvider()).isEqualTo("BRouter");
        assertThat(preview.getProfile()).isEqualTo("safety#0");
        assertThat(preview.getDistanceM().intValue()).isEqualTo(1500);
        assertThat(preview.getElevationGainM().intValue()).isEqualTo(80);
        assertThat(preview.getPavedDistanceM().intValue()).isEqualTo(100);
        assertThat(preview.getUnpavedDistanceM().intValue()).isEqualTo(50);
        assertThat(preview.getCyclewayDistanceM().intValue()).isEqualTo(100);
        assertThat(preview.getQuietDistanceM().intValue()).isEqualTo(150);

        server.verify();
    }

    @Test
    void calculateRouteChoosesLongerAlternativeWhenRequested() {
        RoutePlanningPreferences preferences = RoutePlanningPreferences.defaults().toBuilder()
                .distancePreference(RoutePlanningPreferences.DistancePreference.LONGER)
                .build();

        server.expect(requestTo(allOf(containsString("profile=safety"), containsString("alternativeidx=0"))))
                .andExpect(method(GET))
                .andRespond(withSuccess(brouterResponse(1200, 60, 260, "safety", 0), MediaType.APPLICATION_JSON));
        server.expect(requestTo(allOf(containsString("profile=safety"), containsString("alternativeidx=1"))))
                .andExpect(method(GET))
                .andRespond(withSuccess(brouterResponse(1900, 90, 390, "safety", 1), MediaType.APPLICATION_JSON));

        RoutePreview preview = adapter.calculateRoute(sampleWaypoints(), preferences);

        assertThat(preview.getProvider()).isEqualTo("BRouter");
        assertThat(preview.getProfile()).isEqualTo("safety#1");
        assertThat(preview.getDistanceM().intValue()).isEqualTo(1900);

        server.verify();
    }

    @Test
    void calculateRouteFallsBackToOsrmWhenBrouterFails() {
        server.expect(requestTo(containsString("routing.test/brouter")))
                .andExpect(method(GET))
                .andRespond(withServerError());
        server.expect(requestTo(containsString("/route/v1/cycling/")))
                .andExpect(method(GET))
                .andRespond(withSuccess(osrmResponse(), MediaType.APPLICATION_JSON));

        RoutePreview preview = adapter.calculateRoute(sampleWaypoints(), RoutePlanningPreferences.defaults());

        assertThat(preview.getProvider()).isEqualTo("OSRM");
        assertThat(preview.getNotices()).isNotEmpty();

        server.verify();
    }

    private List<double[]> sampleWaypoints() {
        return List.of(
                new double[]{50.0647, 19.9450},
                new double[]{49.9870, 20.0644});
    }

    private String brouterResponse(int distanceM, int ascentM, int timeSec, String profile, int alternativeIndex) {
        return """
                {
                  "type": "FeatureCollection",
                  "features": [
                    {
                      "type": "Feature",
                      "properties": {
                        "name": "brouter_%s_%d",
                        "track-length": "%d",
                        "filtered ascend": "%d",
                        "total-time": "%d",
                        "messages": [
                          ["Longitude", "Latitude", "Elevation", "Distance", "CostPerKm", "ElevCost", "TurnCost", "NodeCost", "InitialCost", "WayTags"],
                          ["19944959", "50064690", "214", "100", "1150", "0", "0", "0", "0", "highway=cycleway surface=asphalt estimated_traffic_class=1"],
                          ["20064400", "49987000", "240", "50", "1150", "0", "0", "0", "0", "highway=track surface=gravel estimated_traffic_class=2"]
                        ]
                      },
                      "geometry": {
                        "type": "LineString",
                        "coordinates": [
                          [19.9450, 50.0647],
                          [20.0644, 49.9870]
                        ]
                      }
                    }
                  ]
                }
                """.formatted(profile, alternativeIndex, distanceM, ascentM, timeSec);
    }

    private String osrmResponse() {
        return """
                {
                  "code": "Ok",
                  "routes": [
                    {
                      "distance": 1400.0,
                      "duration": 320.0,
                      "geometry": {
                        "coordinates": [
                          [19.9450, 50.0647],
                          [20.0644, 49.9870]
                        ]
                      }
                    }
                  ]
                }
                """;
    }
}
