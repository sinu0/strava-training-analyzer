package pl.strava.analizator.infrastructure.strava;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Objects;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.infrastructure.strava.dto.StravaStreamDto;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class StravaApiClientTest {

    @Mock
    private StravaConfigProvider stravaConfigProvider;

    @Mock
    private StravaOAuth2Service oAuth2Service;

    @Mock
    private RestTemplate restTemplate;

    private StravaApiClient apiClient;
    private AthleteProfile profile;

    @BeforeEach
    void setUp() {
        apiClient = new StravaApiClient(stravaConfigProvider, oAuth2Service, restTemplate, new ObjectMapper());
        profile = AthleteProfile.builder().stravaAthleteId(123L).build();

        when(stravaConfigProvider.apiBaseUrl()).thenReturn("https://www.strava.com/api/v3");
        when(oAuth2Service.getValidAccessToken(profile)).thenReturn("token-123");
    }

    @Test
    void parsesStreamSetObjectResponse() {
        String body = """
                {
                  "time": {
                    "data": [0, 1, 2],
                    "series_type": "distance",
                    "original_size": 3,
                    "resolution": "high"
                  },
                  "watts": {
                    "type": "watts",
                    "data": [210, 220, 230],
                    "series_type": "distance",
                    "original_size": 3,
                    "resolution": "high"
                  }
                }
                """;

        when(restTemplate.exchange(
          eq(Objects.requireNonNull("https://www.strava.com/api/v3/activities/42/streams?keys=heartrate,watts,cadence,altitude,time,latlng,distance,velocity_smooth&key_by_type=true")),
          eq(Objects.requireNonNull(HttpMethod.GET)),
                any(HttpEntity.class),
          eq(Objects.requireNonNull(String.class))))
                .thenReturn(ResponseEntity.ok(body));

        List<StravaStreamDto> streams = apiClient.getActivityStreams(profile, "42");

        assertThat(streams).hasSize(2);
        assertThat(streams).extracting(StravaStreamDto::getType).contains("time", "watts");
    }

    @Test
    void returnsEmptyListWhenStreamPayloadCannotBeParsed() {
        when(restTemplate.exchange(
          eq(Objects.requireNonNull("https://www.strava.com/api/v3/activities/42/streams?keys=heartrate,watts,cadence,altitude,time,latlng,distance,velocity_smooth&key_by_type=true")),
          eq(Objects.requireNonNull(HttpMethod.GET)),
                any(HttpEntity.class),
          eq(Objects.requireNonNull(String.class))))
                .thenThrow(new RestClientException("boom"));

        assertThat(apiClient.getActivityStreams(profile, "42")).isEmpty();
    }

    @Test
    void photoRequestsUseMidnightUtcForDailyRateLimitResets() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-ReadRateLimit-Limit", "100,1000");
        headers.add("X-ReadRateLimit-Usage", "12,1000");

        when(restTemplate.exchange(
                eq(Objects.requireNonNull("https://www.strava.com/api/v3/activities/42/photos?size=2048")),
                eq(Objects.requireNonNull(HttpMethod.GET)),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too Many Requests",
                        headers,
                        new byte[0],
                        StandardCharsets.UTF_8));

        Instant expectedReset = LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        assertThatThrownBy(() -> apiClient.getActivityPhotos(profile, "42"))
                .isInstanceOf(RateLimitException.class)
                .extracting(ex -> ((RateLimitException) ex).getResetsAt())
                .isEqualTo(expectedReset);
    }

    @Test
    void photoRequestsUseNextQuarterHourForShortRateLimitResets() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-ReadRateLimit-Limit", "100,1000");
        headers.add("X-ReadRateLimit-Usage", "100,120");

        when(restTemplate.exchange(
                eq(Objects.requireNonNull("https://www.strava.com/api/v3/activities/42/photos?size=2048")),
                eq(Objects.requireNonNull(HttpMethod.GET)),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too Many Requests",
                        headers,
                        new byte[0],
                        StandardCharsets.UTF_8));

        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC).withSecond(0).withNano(0);
        int currentQuarter = now.getMinute() / 15;
        int nextQuarterMinute = (currentQuarter + 1) * 15;
        Instant expectedReset = nextQuarterMinute >= 60
                ? now.plusHours(1).withMinute(0).toInstant()
                : now.withMinute(nextQuarterMinute).toInstant();

        assertThatThrownBy(() -> apiClient.getActivityPhotos(profile, "42"))
                .isInstanceOf(RateLimitException.class)
                .extracting(ex -> ((RateLimitException) ex).getResetsAt())
                .isEqualTo(expectedReset);
    }
}
