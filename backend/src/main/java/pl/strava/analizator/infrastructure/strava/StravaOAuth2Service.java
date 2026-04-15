package pl.strava.analizator.infrastructure.strava;

import java.time.Instant;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.infrastructure.config.EncryptionUtil;
import pl.strava.analizator.infrastructure.strava.dto.StravaAthleteDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaTokenResponse;

@Service
@RequiredArgsConstructor
public class StravaOAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(StravaOAuth2Service.class);

    private final StravaConfigProvider stravaConfigProvider;
    private final AthleteProfileRepository profileRepository;
    private final EncryptionUtil encryptionUtil;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String getAuthorizationUrl() {
        return stravaConfigProvider.authorizationUrl();
    }

    public AthleteProfile exchangeCodeForTokens(String code) {
        StravaTokenResponse tokenResponse = requestToken(Map.of(
                "grant_type", "authorization_code",
                "code", code
        ));

        return saveTokensAndProfile(tokenResponse);
    }

    public String getValidAccessToken(AthleteProfile profile) {
        if (profile.getStravaTokenExpires() != null
                && Instant.now().isBefore(profile.getStravaTokenExpires().minusSeconds(60))) {
            return encryptionUtil.decrypt(profile.getStravaAccessToken());
        }
        return refreshAccessToken(profile);
    }

    private String refreshAccessToken(AthleteProfile profile) {
        String refreshToken = encryptionUtil.decrypt(profile.getStravaRefreshToken());
        log.info("Refreshing Strava token for athlete {}", profile.getStravaAthleteId());

        StravaTokenResponse tokenResponse = requestToken(Map.of(
                "grant_type", "refresh_token",
                "refresh_token", refreshToken
        ));

        AthleteProfile updated = AthleteProfile.builder()
                .id(profile.getId())
                .name(profile.getName())
                .email(profile.getEmail())
                .ftpWatts(profile.getFtpWatts())
                .lthrBpm(profile.getLthrBpm())
                .maxHrBpm(profile.getMaxHrBpm())
                .restingHrBpm(profile.getRestingHrBpm())
                .weightKg(profile.getWeightKg())
                .dateOfBirth(profile.getDateOfBirth())
                .stravaAthleteId(profile.getStravaAthleteId())
                .stravaAccessToken(encryptionUtil.encrypt(tokenResponse.getAccessToken()))
                .stravaRefreshToken(encryptionUtil.encrypt(tokenResponse.getRefreshToken()))
                .stravaTokenExpires(Instant.ofEpochSecond(tokenResponse.getExpiresAt()))
                .garminUserId(profile.getGarminUserId())
                .garminToken(profile.getGarminToken())
                .createdAt(profile.getCreatedAt())
                .updatedAt(Instant.now())
                .build();

        profileRepository.save(updated);
        return tokenResponse.getAccessToken();
    }

    private StravaTokenResponse requestToken(Map<String, String> extraParams) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", stravaConfigProvider.clientId());
        body.add("client_secret", stravaConfigProvider.clientSecret());
        extraParams.forEach(body::add);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("null")
            String rawResponse = restTemplate.postForObject(
                    stravaConfigProvider.tokenUrl(), request, String.class);
            if (rawResponse == null || rawResponse.isBlank()) {
                throw new StravaApiException("Empty token response from Strava");
            }
            return parseTokenResponse(rawResponse);
        } catch (RestClientException e) {
            throw new StravaApiException("Failed to exchange token with Strava: " + e.getMessage(), e);
        }
    }

    private StravaTokenResponse parseTokenResponse(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            if (root.hasNonNull("message") && !root.hasNonNull("access_token")) {
                String message = root.path("message").asText("Unknown Strava API error");
                throw new StravaApiException("Failed to exchange token with Strava: " + message);
            }

            StravaTokenResponse response = objectMapper.treeToValue(root, StravaTokenResponse.class);
            if (response.getAccessToken() == null || response.getRefreshToken() == null || response.getExpiresAt() <= 0) {
                throw new StravaApiException("Failed to exchange token with Strava: incomplete token response");
            }
            return response;
        } catch (JsonProcessingException e) {
            throw new StravaApiException(
                    "Failed to exchange token with Strava: could not parse response body: " + abbreviate(rawResponse), e);
        }
    }

    private String abbreviate(String rawResponse) {
        String compact = rawResponse.replaceAll("\\s+", " ").trim();
        return compact.length() <= 240 ? compact : compact.substring(0, 240) + "...";
    }

    private AthleteProfile saveTokensAndProfile(StravaTokenResponse tokenResponse) {
        StravaAthleteDto athlete = tokenResponse.getAthlete();

        AthleteProfile existing = athlete != null
            ? profileRepository.findByStravaAthleteId(athlete.getId())
                .or(() -> profileRepository.findFirst())
                .orElse(null)
            : profileRepository.findFirst().orElse(null);

        String name = athlete != null
                ? (athlete.getFirstName() + " " + athlete.getLastName()).trim()
                : "Athlete";

        AthleteProfile.AthleteProfileBuilder builder = AthleteProfile.builder()
                .stravaAthleteId(athlete != null ? athlete.getId() : null)
                .stravaAccessToken(encryptionUtil.encrypt(tokenResponse.getAccessToken()))
                .stravaRefreshToken(encryptionUtil.encrypt(tokenResponse.getRefreshToken()))
                .stravaTokenExpires(Instant.ofEpochSecond(tokenResponse.getExpiresAt()))
                .updatedAt(Instant.now());

        if (existing != null) {
            String existingName = existing.getName();
            boolean shouldUseStravaName = existingName == null
                || existingName.isBlank()
                || "Athlete".equalsIgnoreCase(existingName.trim());

            builder.id(existing.getId())
                .name(shouldUseStravaName ? name : existing.getName())
                    .email(existing.getEmail() != null ? existing.getEmail() : (athlete != null ? athlete.getEmail() : null))
                    .ftpWatts(existing.getFtpWatts() != null ? existing.getFtpWatts()
                            : (athlete != null && athlete.getFtp() != null ? athlete.getFtp().shortValue() : null))
                    .lthrBpm(existing.getLthrBpm())
                    .maxHrBpm(existing.getMaxHrBpm())
                    .restingHrBpm(existing.getRestingHrBpm())
                    .weightKg(existing.getWeightKg() != null ? existing.getWeightKg()
                            : (athlete != null && athlete.getWeight() != null ? java.math.BigDecimal.valueOf(athlete.getWeight()) : null))
                    .dateOfBirth(existing.getDateOfBirth())
                    .garminUserId(existing.getGarminUserId())
                    .garminToken(existing.getGarminToken())
                    .createdAt(existing.getCreatedAt());
        } else {
            builder.name(name)
                    .email(athlete != null ? athlete.getEmail() : null)
                    .ftpWatts(athlete != null && athlete.getFtp() != null ? athlete.getFtp().shortValue() : null)
                    .weightKg(athlete != null && athlete.getWeight() != null ? java.math.BigDecimal.valueOf(athlete.getWeight()) : null)
                    .createdAt(Instant.now());
        }

        return profileRepository.save(builder.build());
    }
}
