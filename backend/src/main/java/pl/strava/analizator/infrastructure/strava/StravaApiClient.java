package pl.strava.analizator.infrastructure.strava;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.infrastructure.strava.dto.StravaActivityDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaActivityPhotoDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaStreamDto;

@Component
@RequiredArgsConstructor
public class StravaApiClient {

    private static final Logger log = LoggerFactory.getLogger(StravaApiClient.class);
    private static final int PER_PAGE = 200;

    private final StravaConfigProvider stravaConfigProvider;
    private final StravaOAuth2Service oAuth2Service;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public List<StravaActivityDto> getActivities(AthleteProfile profile, int page, Long after) {
        return getActivities(profile, page, after, PER_PAGE);
    }

    public List<StravaActivityDto> getActivities(AthleteProfile profile, int page, Long after, int perPage) {
        String token = oAuth2Service.getValidAccessToken(profile);
        String url = stravaConfigProvider.apiBaseUrl() + "/athlete/activities?per_page=" + perPage + "&page=" + page;
        if (after != null) {
            url += "&after=" + after;
        }

        try {
            ResponseEntity<List<StravaActivityDto>> response = restTemplate.exchange(
                    url,
                    Objects.requireNonNull(HttpMethod.GET),
                    authEntity(token),
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw rateLimitException(e);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("Strava 401 — token may have expired during batch");
            throw new StravaApiException("Unauthorized", e);
        } catch (HttpClientErrorException e) {
            throw new StravaApiException(
                    "Failed to fetch Strava activities: " + extractFaultMessage(e.getResponseBodyAsString(), e.getStatusText()), e);
        } catch (RestClientException e) {
            throw new StravaApiException("Failed to parse Strava activities response: " + rootMessage(e), e);
        }
    }

    public StravaActivityDto getActivityDetail(AthleteProfile profile, String externalId) {
        String token = oAuth2Service.getValidAccessToken(profile);
        String url = stravaConfigProvider.apiBaseUrl() + "/activities/" + externalId;

        try {
            return restTemplate.exchange(
                    url, Objects.requireNonNull(HttpMethod.GET), authEntity(token), StravaActivityDto.class
            ).getBody();
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw rateLimitException(e);
        } catch (HttpClientErrorException e) {
            throw new StravaApiException(
                    "Failed to fetch activity " + externalId + ": "
                            + extractFaultMessage(e.getResponseBodyAsString(), e.getStatusText()),
                    e);
        }
    }

    public List<StravaStreamDto> getActivityStreams(AthleteProfile profile, String externalId) {
        String token = oAuth2Service.getValidAccessToken(profile);
        String url = stravaConfigProvider.apiBaseUrl() + "/activities/" + externalId
                + "/streams?keys=heartrate,watts,cadence,altitude,time,latlng,distance,velocity_smooth&key_by_type=true";

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, Objects.requireNonNull(HttpMethod.GET), authEntity(token), String.class
            );
            return parseStreamsResponse(response.getBody());
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw rateLimitException(e);
        } catch (HttpClientErrorException e) {
            log.warn("Failed to fetch streams for activity {}: {}", externalId, e.getStatusCode());
            return Collections.emptyList();
        } catch (RestClientException | StravaApiException e) {
            log.warn("Failed to parse streams for activity {}: {}", externalId, rootMessage(e));
            return Collections.emptyList();
        }
    }

    public List<StravaActivityPhotoDto> getActivityPhotos(AthleteProfile profile, String externalId) {
        String token = oAuth2Service.getValidAccessToken(profile);
        String url = stravaConfigProvider.apiBaseUrl() + "/activities/" + externalId + "/photos?size=2048";

        try {
            ResponseEntity<List<StravaActivityPhotoDto>> response = restTemplate.exchange(
                    url,
                    Objects.requireNonNull(HttpMethod.GET),
                    authEntity(token),
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (HttpClientErrorException.NotFound e) {
            return Collections.emptyList();
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw rateLimitException(e);
        } catch (HttpClientErrorException e) {
            log.warn("Failed to fetch photos for activity {}: {}", externalId, e.getStatusCode());
            return Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("Failed to parse photo response for activity {}: {}", externalId, rootMessage(e));
            return Collections.emptyList();
        }
    }

    private HttpEntity<Void> authEntity(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(Objects.requireNonNull(token));
        return new HttpEntity<>(headers);
    }

    private List<StravaStreamDto> parseStreamsResponse(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return Collections.emptyList();
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.isArray()) {
                return objectMapper.convertValue(root, new TypeReference<>() {});
            }
            if (root.isObject()) {
                List<StravaStreamDto> streams = new ArrayList<>();
                root.fields().forEachRemaining(entry -> {
                    JsonNode value = entry.getValue();
                    if (!value.isObject()) {
                        return;
                    }
                    StravaStreamDto stream = objectMapper.convertValue(value, StravaStreamDto.class);
                    if (stream.getType() == null || stream.getType().isBlank()) {
                        stream.setType(entry.getKey());
                    }
                    streams.add(stream);
                });
                return streams;
            }
        } catch (IllegalArgumentException | JsonProcessingException e) {
            throw new StravaApiException("Failed to parse Strava streams response: " + abbreviate(rawBody), e);
        }

        throw new StravaApiException("Unexpected Strava streams response: " + abbreviate(rawBody));
    }

    private String extractFaultMessage(String rawBody, String fallback) {
        if (rawBody == null || rawBody.isBlank()) {
            return fallback;
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.hasNonNull("message")) {
                return root.path("message").asText(fallback);
            }
        } catch (JsonProcessingException ignored) {
            // Keep a compact raw body if Strava does not return JSON.
        }
        return abbreviate(rawBody);
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage() != null ? current.getMessage() : throwable.getMessage();
    }

    private String abbreviate(String rawBody) {
        String compact = rawBody.replaceAll("\\s+", " ").trim();
        return compact.length() <= 240 ? compact : compact.substring(0, 240) + "...";
    }

    private RateLimitException rateLimitException(HttpClientErrorException.TooManyRequests e) {
        HttpHeaders headers = e.getResponseHeaders();
        Instant resetsAt = resolveRateLimitReset(headers);
        log.warn("Strava rate limit hit, resets at {}", resetsAt);
        return new RateLimitException(resetsAt, e);
    }

    private Instant resolveRateLimitReset(HttpHeaders headers) {
        RateLimitWindow window = detectExceededWindow(headers);
        if (window == RateLimitWindow.DAILY) {
            return nextUtcMidnight();
        }
        if (window == RateLimitWindow.SHORT_TERM) {
            return nextQuarterHourUtc();
        }
        return parseRetryAfter(headers).orElseGet(() -> Instant.now().plusSeconds(900));
    }

    private RateLimitWindow detectExceededWindow(HttpHeaders headers) {
        if (headers == null) {
            return RateLimitWindow.UNKNOWN;
        }

        RateLimitWindow readWindow = detectExceededWindow(
                headers.getFirst("X-ReadRateLimit-Limit"),
                headers.getFirst("X-ReadRateLimit-Usage"));
        if (readWindow != RateLimitWindow.UNKNOWN) {
            return readWindow;
        }

        return detectExceededWindow(
                headers.getFirst("X-RateLimit-Limit"),
                headers.getFirst("X-RateLimit-Usage"));
    }

    private RateLimitWindow detectExceededWindow(String limitsHeader, String usageHeader) {
        int[] limits = parseRateLimitPair(limitsHeader);
        int[] usage = parseRateLimitPair(usageHeader);
        if (limits == null || usage == null) {
            return RateLimitWindow.UNKNOWN;
        }
        if (limits[1] > 0 && usage[1] >= limits[1]) {
            return RateLimitWindow.DAILY;
        }
        if (limits[0] > 0 && usage[0] >= limits[0]) {
            return RateLimitWindow.SHORT_TERM;
        }
        return RateLimitWindow.UNKNOWN;
    }

    private int[] parseRateLimitPair(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }

        String[] parts = headerValue.split(",");
        if (parts.length != 2) {
            return null;
        }

        try {
            return new int[] {
                    Integer.parseInt(parts[0].trim()),
                    Integer.parseInt(parts[1].trim())
            };
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private java.util.Optional<Instant> parseRetryAfter(HttpHeaders headers) {
        if (headers == null) {
            return java.util.Optional.empty();
        }

        String retryAfter = headers.getFirst("Retry-After");
        if (retryAfter == null) {
            return java.util.Optional.empty();
        }

        try {
            return java.util.Optional.of(Instant.now().plusSeconds(Long.parseLong(retryAfter)));
        } catch (NumberFormatException ignored) {
            return java.util.Optional.empty();
        }
    }

    private Instant nextQuarterHourUtc() {
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC).withSecond(0).withNano(0);
        int currentQuarter = now.getMinute() / 15;
        int nextQuarterMinute = (currentQuarter + 1) * 15;
        if (nextQuarterMinute >= 60) {
            return now.plusHours(1).withMinute(0).toInstant();
        }
        return now.withMinute(nextQuarterMinute).toInstant();
    }

    private Instant nextUtcMidnight() {
        return LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private enum RateLimitWindow {
        SHORT_TERM,
        DAILY,
        UNKNOWN
    }
}
