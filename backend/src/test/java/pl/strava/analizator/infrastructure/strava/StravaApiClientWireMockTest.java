package pl.strava.analizator.infrastructure.strava;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

import pl.strava.analizator.domain.model.AthleteProfile;

class StravaApiClientWireMockTest {

    private WireMockServer wireMock;

    @BeforeEach
    void startWireMock() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
    }

    @AfterEach
    void stopWireMock() {
        wireMock.stop();
    }

    @Test
    void requestsAndDeserializesAllSegmentEffortsFromActivityDetail() {
        wireMock.stubFor(get(urlEqualTo("/activities/42?include_all_efforts=true"))
                .withHeader(HttpHeaders.AUTHORIZATION, com.github.tomakehurst.wiremock.client.WireMock.equalTo("Bearer token"))
                .willReturn(aResponse().withStatus(200).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .withBody("""
                                {
                                  "id": 42,
                                  "segment_efforts": [{
                                    "id": 9001,
                                    "elapsed_time": 73,
                                    "start_index": 10,
                                    "end_index": 35,
                                    "segment": {"id": 77, "name": "Podjazd testowy", "distance": 812.4}
                                  }]
                                }
                                """)));
        StravaConfigProvider config = mock(StravaConfigProvider.class);
        StravaOAuth2Service oauth = mock(StravaOAuth2Service.class);
        AthleteProfile profile = AthleteProfile.builder().stravaAthleteId(123L).build();
        when(config.apiBaseUrl()).thenReturn(wireMock.baseUrl());
        when(oauth.getValidAccessToken(profile)).thenReturn("token");
        StravaApiClient client = new StravaApiClient(config, oauth, new RestTemplate(), new ObjectMapper());

        var activity = client.getActivityDetail(profile, "42");

        assertThat(activity.getSegmentEfforts()).singleElement().satisfies(effort -> {
            assertThat(effort.getId()).isEqualTo(9001L);
            assertThat(effort.getStartIndex()).isEqualTo(10);
            assertThat(effort.getSegment().getId()).isEqualTo(77L);
        });
        wireMock.verify(getRequestedFor(urlEqualTo("/activities/42?include_all_efforts=true")));
    }
}
