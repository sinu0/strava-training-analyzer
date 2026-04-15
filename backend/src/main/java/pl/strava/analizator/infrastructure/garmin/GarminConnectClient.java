package pl.strava.analizator.infrastructure.garmin;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import pl.strava.analizator.infrastructure.garmin.dto.GarminDailySummaryDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHeartRateDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHrvDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminSleepDto;

/**
 * HTTP client for the Garmin Connect reverse-engineered API.
 * <p>
 * WARNING: This uses unofficial, undocumented Garmin endpoints that may break
 * at any time without notice. Garmin does not provide an official public API
 * for health/wellness data.
 */
@Component
public class GarminConnectClient {

    private static final Logger log = LoggerFactory.getLogger(GarminConnectClient.class);

    private static final String SSO_BASE = "https://sso.garmin.com/sso";
    private static final String SSO_SIGNIN_URL = SSO_BASE + "/signin";
    private static final String SSO_LOGIN_URL = SSO_BASE + "/signin";
    private static final String MODERN_BASE = "https://connect.garmin.com/modern";
    private static final String PROXY_BASE = MODERN_BASE + "/proxy";
    private static final String SERVICE_URL_PARAM = "https://connect.garmin.com/modern";

    private static final Pattern TICKET_PATTERN = Pattern.compile("ticket=([^\"']+)");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final long RATE_LIMIT_MS = 1000;
    private static final String CLOUDFLARE_MARKER = "cloudflare";
    private static final String BLOCKED_MARKER = "you have been blocked";
    private static final String ATTENTION_REQUIRED_MARKER = "attention required!";
    private static final String ENABLE_COOKIES_MARKER = "please enable cookies";

    private final RestTemplate restTemplate;

    // Session state — not persistent, re-authenticate each sync batch
    private final List<String> sessionCookies = new ArrayList<>();
    private String displayName;
    private long lastRequestTime;
    private AuthFailure lastAuthFailure;

    public GarminConnectClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Authenticate with Garmin Connect SSO using email and password.
     * Must be called before any data-fetching methods.
     *
     * @return true if authentication succeeded
     */
    public boolean authenticate(String email, String password) {
        sessionCookies.clear();
        displayName = null;
        lastAuthFailure = null;

        try {
            // Step 1: GET the sign-in page to obtain CSRF token and initial cookies
            log.debug("Garmin SSO Step 1: fetching sign-in page");
            String signinUrl = SSO_SIGNIN_URL + "?service=" + SERVICE_URL_PARAM
                    + "&webhost=" + MODERN_BASE
                    + "&gateway=true"
                    + "&generateExtraServiceTicket=true"
                    + "&generateTwoExtraServiceTickets=true";

            HttpHeaders getHeaders = new HttpHeaders();
            getHeaders.set("User-Agent", "Mozilla/5.0");
            ResponseEntity<String> signinResponse = restTemplate.exchange(
                    signinUrl, HttpMethod.GET, new HttpEntity<>(getHeaders), String.class);

            collectCookies(signinResponse);
            if (isCloudflareBlockPage(signinResponse.getBody())) {
                lastAuthFailure = cloudflareBlockedFailure(email);
                log.error("Garmin SSO sign-in page blocked for {} by Cloudflare", email);
                return false;
            }
            String csrfToken = extractCsrfToken(signinResponse.getBody());
            log.debug("Garmin SSO Step 1 complete — status: {}, CSRF found: {}",
                    signinResponse.getStatusCode(), csrfToken != null);

            // Step 2: POST credentials to get a service ticket
            log.debug("Garmin SSO Step 2: posting credentials for {}", email);
            HttpHeaders postHeaders = new HttpHeaders();
            postHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            postHeaders.set("User-Agent", "Mozilla/5.0");
            postHeaders.set("Cookie", joinCookies());
            if (csrfToken != null) {
                postHeaders.set("Referer", signinUrl);
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("username", email);
            form.add("password", password);
            form.add("embed", "false");
            if (csrfToken != null) {
                form.add("_csrf", csrfToken);
            }

            ResponseEntity<String> loginResponse = restTemplate.exchange(
                    SSO_LOGIN_URL + "?service=" + SERVICE_URL_PARAM,
                    HttpMethod.POST,
                    new HttpEntity<>(form, postHeaders),
                    String.class);

            collectCookies(loginResponse);
            if (isCloudflareBlockPage(loginResponse.getBody())) {
                lastAuthFailure = cloudflareBlockedFailure(email);
                log.error("Garmin SSO credential post blocked for {} by Cloudflare", email);
                return false;
            }
            log.debug("Garmin SSO Step 2 complete — status: {}", loginResponse.getStatusCode());

            String ticket = extractTicket(loginResponse.getBody());
            if (ticket == null) {
                int bodyLen = loginResponse.getBody() != null ? loginResponse.getBody().length() : 0;
                log.warn("Garmin SSO: failed to extract service ticket — status: {}, body length: {}",
                        loginResponse.getStatusCode(), bodyLen);
                lastAuthFailure = classifyMissingTicketFailure(email, loginResponse.getBody());
                return false;
            }

            // Step 3: Exchange ticket to establish session
            log.debug("Garmin SSO Step 3: exchanging ticket for session");
            HttpHeaders ticketHeaders = new HttpHeaders();
            ticketHeaders.set("User-Agent", "Mozilla/5.0");
            ticketHeaders.set("Cookie", joinCookies());

            ResponseEntity<String> sessionResponse = restTemplate.exchange(
                    MODERN_BASE + "?ticket=" + ticket,
                    HttpMethod.GET,
                    new HttpEntity<>(ticketHeaders),
                    String.class);

            collectCookies(sessionResponse);

            // Use email as display name fallback
            this.displayName = email;
            this.lastAuthFailure = null;
            log.info("Garmin Connect authentication successful for {}", email);
            return true;

        } catch (RestClientResponseException e) {
            lastAuthFailure = classifyHttpFailure(email, e);
            log.error("Garmin SSO authentication failed for {}: {}", email, lastAuthFailure.message());
            return false;
        } catch (RestClientException e) {
            lastAuthFailure = new AuthFailure(
                    "Garmin SSO request failed for " + email + ": " + e.getMessage(),
                    true);
            log.error("Garmin SSO authentication failed for {}: {}", email, lastAuthFailure.message());
            return false;
        }
    }

    public GarminDailySummaryDto fetchDailySummary(LocalDate date) {
        String url = PROXY_BASE + "/usersummary-service/usersummary/daily/"
                + displayName + "?calendarDate=" + date.format(DATE_FMT);
        return doGet(url, GarminDailySummaryDto.class);
    }

    public GarminHeartRateDto fetchHeartRate(LocalDate date) {
        String url = PROXY_BASE + "/wellness-service/wellness/dailyHeartRate/"
                + displayName + "?date=" + date.format(DATE_FMT);
        return doGet(url, GarminHeartRateDto.class);
    }

    public GarminSleepDto fetchSleep(LocalDate date) {
        String url = PROXY_BASE + "/wellness-service/wellness/dailySleepData/"
                + displayName + "?date=" + date.format(DATE_FMT);
        return doGet(url, GarminSleepDto.class);
    }

    public GarminHrvDto fetchHrv(LocalDate date) {
        String url = PROXY_BASE + "/hrv-service/hrv/" + displayName
                + "?date=" + date.format(DATE_FMT);
        return doGet(url, GarminHrvDto.class);
    }

    public boolean isAuthenticated() {
        return !sessionCookies.isEmpty() && displayName != null;
    }

    public AuthFailure getLastAuthFailure() {
        return lastAuthFailure;
    }

    // --- internal helpers ---

    private <T> T doGet(String url, Class<T> responseType) {
        if (!isAuthenticated()) {
            log.warn("Garmin API call skipped — not authenticated");
            return null;
        }

        enforceRateLimit();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            headers.set("Cookie", joinCookies());
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            ResponseEntity<T> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), responseType);

            collectCookies(response);
            return response.getBody();

        } catch (RestClientException e) {
            log.warn("Garmin API call failed for {}: {}", url, e.getMessage());
            return null;
        }
    }

    private void enforceRateLimit() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastRequestTime;
        if (elapsed < RATE_LIMIT_MS) {
            try {
                Thread.sleep(RATE_LIMIT_MS - elapsed);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        lastRequestTime = System.currentTimeMillis();
    }

    private void collectCookies(ResponseEntity<?> response) {
        List<String> setCookieHeaders = response.getHeaders().get(HttpHeaders.SET_COOKIE);
        if (setCookieHeaders != null) {
            for (String header : setCookieHeaders) {
                // Extract cookie name=value (before the first ';')
                String cookiePair = header.split(";")[0].trim();
                String cookieName = cookiePair.split("=")[0];

                // Replace existing cookie with same name
                sessionCookies.removeIf(c -> c.startsWith(cookieName + "="));
                sessionCookies.add(cookiePair);
            }
        }
    }

    private String joinCookies() {
        return String.join("; ", sessionCookies);
    }

    private String extractCsrfToken(String html) {
        if (html == null) {
            return null;
        }
        Pattern csrfPattern = Pattern.compile("name=\"_csrf\"\\s+value=\"([^\"]+)\"");
        Matcher matcher = csrfPattern.matcher(html);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String extractTicket(String html) {
        if (html == null) {
            return null;
        }
        Matcher matcher = TICKET_PATTERN.matcher(html);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private AuthFailure classifyMissingTicketFailure(String email, String body) {
        if (isCloudflareBlockPage(body)) {
            return cloudflareBlockedFailure(email);
        }
        return new AuthFailure(
                "Garmin SSO did not return a service ticket for " + email
                        + ". Credentials may be invalid or Garmin changed the unofficial login flow.",
                false);
    }

    private AuthFailure classifyHttpFailure(String email, RestClientResponseException e) {
        String body = e.getResponseBodyAsString();
        if (isCloudflareBlockPage(body)) {
            return cloudflareBlockedFailure(email);
        }

        int status = e.getStatusCode().value();
        if (status >= 500 || status == 429) {
            return new AuthFailure(
                    "Garmin SSO returned HTTP " + status + " for " + email + ". The request may succeed later.",
                    true);
        }

        return new AuthFailure(
                "Garmin SSO returned HTTP " + status + " for " + email
                        + ". Credentials may be invalid or access is blocked.",
                false);
    }

    private AuthFailure cloudflareBlockedFailure(String email) {
        return new AuthFailure(
                "Garmin Connect login blocked by Cloudflare for " + email
                        + ". This unofficial Garmin SSO flow currently cannot authenticate from this server or IP.",
                false);
    }

    private boolean isCloudflareBlockPage(String body) {
        if (body == null) {
            return false;
        }
        String normalized = body.toLowerCase();
        return normalized.contains(CLOUDFLARE_MARKER)
                && (normalized.contains(BLOCKED_MARKER)
                || normalized.contains(ATTENTION_REQUIRED_MARKER)
                || normalized.contains(ENABLE_COOKIES_MARKER));
    }

    public record AuthFailure(String message, boolean retryable) {
    }
}
