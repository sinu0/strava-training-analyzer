package pl.strava.analizator.infrastructure.garmin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import pl.strava.analizator.infrastructure.garmin.dto.GarminDailySummaryDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHeartRateDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminSleepDto;

@ExtendWith(MockitoExtension.class)
class GarminConnectClientTest {

    @Mock
    private RestTemplate restTemplate;

    private GarminConnectClient client;

    @BeforeEach
    void setUp() {
        client = new GarminConnectClient(restTemplate);
    }

    @Test
    void authenticateReturnsFalseWhenSsoFails() {
        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "<html><input name=\"_csrf\" value=\"test-csrf\"/></html>",
                        emptyHeaders(), HttpStatus.OK));

        // POST login returns no ticket
        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("<html>no ticket here</html>",
                        emptyHeaders(), HttpStatus.OK));

        boolean result = client.authenticate("test@example.com", "password");

        assertThat(result).isFalse();
        assertThat(client.isAuthenticated()).isFalse();
        assertThat(client.getLastAuthFailure()).isNotNull();
        assertThat(client.getLastAuthFailure().retryable()).isFalse();
        assertThat(client.getLastAuthFailure().message()).contains("service ticket");
    }

    @Test
    void authenticateReturnsTrueWhenTicketFound() {
        // GET signin page
        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "<html><input name=\"_csrf\" value=\"csrf123\"/></html>",
                        cookieHeaders("GARMIN-SSO-GUID=abc123"),
                        HttpStatus.OK));

        // POST login with ticket in response
        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "<html>https://connect.garmin.com/modern?ticket=ST-12345-abcdef</html>",
                        cookieHeaders("GARMIN-SSO-CUST-GUID=xyz"),
                        HttpStatus.OK));

        boolean result = client.authenticate("test@example.com", "password");

        assertThat(result).isTrue();
        assertThat(client.isAuthenticated()).isTrue();
        assertThat(client.getLastAuthFailure()).isNull();
    }

    @Test
    void authenticateMarksCloudflareBlockAsNonRetryable() {
        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "<html><input name=\"_csrf\" value=\"csrf123\"/></html>",
                        cookieHeaders("GARMIN-SSO-GUID=abc123"),
                        HttpStatus.OK));

        String cloudflareBody = """
                <!DOCTYPE html>
                <html><head><title>Attention Required! | Cloudflare</title></head>
                <body><h1>Sorry, you have been blocked</h1><div>Please enable cookies.</div></body></html>
                """;

        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.FORBIDDEN,
                        "Forbidden",
                        emptyHeaders(),
                        cloudflareBody.getBytes(StandardCharsets.UTF_8),
                        StandardCharsets.UTF_8));

        boolean result = client.authenticate("blocked@example.com", "password");

        assertThat(result).isFalse();
        assertThat(client.isAuthenticated()).isFalse();
        assertThat(client.getLastAuthFailure()).isNotNull();
        assertThat(client.getLastAuthFailure().retryable()).isFalse();
        assertThat(client.getLastAuthFailure().message()).contains("Cloudflare");
    }

    @Test
    void fetchDailySummaryReturnsNullOnError() {
        // Not authenticated — will get NPE on displayName or similar, should handle gracefully
        GarminDailySummaryDto result = client.fetchDailySummary(LocalDate.of(2024, 1, 15));

        // Client is not authenticated so displayName is null — doGet will fail gracefully
        assertThat(result).isNull();
    }

    @Test
    void fetchHeartRateReturnsDto() {
        simulateAuthenticatedClient();

        GarminHeartRateDto dto = GarminHeartRateDto.builder()
                .restingHeartRate(55)
                .maxHeartRate(180)
                .minHeartRate(42)
                .build();

        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(GarminHeartRateDto.class)))
                .thenReturn(new ResponseEntity<>(dto, emptyHeaders(), HttpStatus.OK));

        GarminHeartRateDto result = client.fetchHeartRate(LocalDate.of(2024, 1, 15));

        assertThat(result).isNotNull();
        assertThat(result.getRestingHeartRate()).isEqualTo(55);
    }

    @Test
    void fetchSleepReturnsDto() {
        simulateAuthenticatedClient();

        GarminSleepDto dto = GarminSleepDto.builder()
                .sleepTimeSeconds(28800)
                .build();

        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(GarminSleepDto.class)))
                .thenReturn(new ResponseEntity<>(dto, emptyHeaders(), HttpStatus.OK));

        GarminSleepDto result = client.fetchSleep(LocalDate.of(2024, 1, 15));

        assertThat(result).isNotNull();
        assertThat(result.getSleepTimeSeconds()).isEqualTo(28800);
    }

    private void simulateAuthenticatedClient() {
        // Authenticate first
        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "<html><input name=\"_csrf\" value=\"csrf\"/></html>",
                        cookieHeaders("GARMIN-SSO-GUID=abc"),
                        HttpStatus.OK));

        when(restTemplate.exchange(
                any(String.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "ticket=ST-12345",
                        cookieHeaders("GARMIN-SSO-CUST-GUID=xyz"),
                        HttpStatus.OK));

        client.authenticate("test@example.com", "password");

        // Reset mock for data calls
        org.mockito.Mockito.reset(restTemplate);
    }

    private HttpHeaders emptyHeaders() {
        return new HttpHeaders();
    }

    private HttpHeaders cookieHeaders(String... cookies) {
        HttpHeaders headers = new HttpHeaders();
        for (String cookie : cookies) {
            headers.add(HttpHeaders.SET_COOKIE, cookie + "; Path=/; Secure");
        }
        return headers;
    }
}
