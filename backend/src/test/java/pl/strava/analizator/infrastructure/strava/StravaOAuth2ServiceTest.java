package pl.strava.analizator.infrastructure.strava;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.UUID;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.infrastructure.config.EncryptionUtil;
import pl.strava.analizator.infrastructure.persistence.jpa.AppConfigJpaRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class StravaOAuth2ServiceTest {

    @Mock private AthleteProfileRepository profileRepository;
    @Mock private RestTemplate restTemplate;
    @Mock private AppConfigJpaRepository appConfigJpaRepository;

    private EncryptionUtil encryptionUtil;
    private StravaConfigProvider stravaConfigProvider;
    private StravaOAuth2Service service;
        private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        encryptionUtil = new EncryptionUtil("0123456789abcdef0123456789abcdef");
        StravaProperties stravaProperties = new StravaProperties(
                "test-client-id", "test-client-secret",
                "http://localhost:8080/api/auth/strava/callback", "verify-token");
        stravaConfigProvider = new StravaConfigProvider(stravaProperties, appConfigJpaRepository, encryptionUtil);
        service = new StravaOAuth2Service(stravaConfigProvider, profileRepository, encryptionUtil, restTemplate, objectMapper);
    }

    @Test
    void getAuthorizationUrlContainsClientId() {
        String url = service.getAuthorizationUrl();
        assertThat(url).contains("client_id=test-client-id");
        assertThat(url).contains("response_type=code");
        assertThat(url).contains("scope=");
        assertThat(url).contains("&state=");
    }

    @Test
    void exchangeCodeRejectsUnknownOauthStateBeforeCallingStrava() {
        assertThatThrownBy(() -> service.exchangeCodeForTokens("auth-code-xyz", "unknown-state"))
                .isInstanceOf(StravaApiException.class)
                .hasMessageContaining("OAuth state");
    }

    @Test
    void exchangeCodeSavesTokensEncrypted() {
        String tokenResponse = """
                {
                  \"access_token\": \"access-123\",
                  \"refresh_token\": \"refresh-456\",
                  \"expires_at\": %d,
                  \"athlete\": {
                    \"id\": 12345,
                    \"firstname\": \"Jan\",
                    \"lastname\": \"Kowalski\",
                    \"email\": \"jan@test.pl\",
                    \"ftp\": 280,
                    \"weight\": 75.5,
                    \"unexpected_field\": \"ignored\"
                  },
                  \"extra_top_level\": true
                }
                """.formatted(Instant.now().plusSeconds(21600).getEpochSecond());

        when(restTemplate.postForObject(anyString(), any(), same(String.class)))
                .thenReturn(tokenResponse);
        when(profileRepository.findByStravaAthleteId(12345L))
                .thenReturn(Optional.empty());
        when(profileRepository.save(any(AthleteProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AthleteProfile profile = service.exchangeCodeForTokens("auth-code-xyz", newOauthState());

        assertThat(profile.getStravaAthleteId()).isEqualTo(12345L);
        assertThat(profile.getName()).isEqualTo("Jan Kowalski");
        // Tokens should be encrypted (not plaintext)
        assertThat(profile.getStravaAccessToken()).isNotEqualTo("access-123");
        assertThat(profile.getStravaRefreshToken()).isNotEqualTo("refresh-456");
        // But decryptable
        assertThat(encryptionUtil.decrypt(profile.getStravaAccessToken())).isEqualTo("access-123");
        assertThat(encryptionUtil.decrypt(profile.getStravaRefreshToken())).isEqualTo("refresh-456");
    }

    @Test
    void exchangeCodeReusesExistingSingleUserProfileWhenOlderRecordHasNoStravaId() {
        String tokenResponse = """
                {
                  \"access_token\": \"access-123\",
                  \"refresh_token\": \"refresh-456\",
                  \"expires_at\": %d,
                  \"athlete\": {
                    \"id\": 12345,
                    \"firstname\": \"Jan\",
                    \"lastname\": \"Kowalski\",
                    \"email\": \"jan@test.pl\"
                  }
                }
                """.formatted(Instant.now().plusSeconds(21600).getEpochSecond());

        AthleteProfile existing = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .name("Athlete")
                .createdAt(Instant.now().minusSeconds(3600))
                .updatedAt(Instant.now().minusSeconds(1800))
                .build();

        when(restTemplate.postForObject(anyString(), any(), same(String.class)))
                .thenReturn(tokenResponse);
        when(profileRepository.findByStravaAthleteId(12345L)).thenReturn(Optional.empty());
        when(profileRepository.findFirst()).thenReturn(Optional.of(existing));
        when(profileRepository.save(any(AthleteProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AthleteProfile saved = service.exchangeCodeForTokens("auth-code-xyz", newOauthState());

        assertThat(saved.getId()).isEqualTo(existing.getId());
        assertThat(saved.getStravaAthleteId()).isEqualTo(12345L);
        assertThat(saved.getName()).isEqualTo("Jan Kowalski");
    }

    @Test
    void exchangeCodeFailsGracefullyOnStravaError() {
        when(restTemplate.postForObject(anyString(), any(), same(String.class)))
                .thenThrow(new RestClientException("Connection refused"));

        assertThatThrownBy(() -> service.exchangeCodeForTokens("bad-code", newOauthState()))
                .isInstanceOf(StravaApiException.class)
                .hasMessageContaining("Failed to exchange token");
    }

    @Test
    void getValidAccessTokenReturnsExistingIfNotExpired() {
        String encryptedToken = encryptionUtil.encrypt("valid-token");
        AthleteProfile profile = AthleteProfile.builder()
                .stravaAccessToken(encryptedToken)
                .stravaTokenExpires(Instant.now().plusSeconds(3600))
                .build();

        String token = service.getValidAccessToken(profile);
        assertThat(token).isEqualTo("valid-token");
    }

    @Test
    void getValidAccessTokenRefreshesWhenExpired() {
        String encryptedRefresh = encryptionUtil.encrypt("refresh-token");
        AthleteProfile profile = AthleteProfile.builder()
                .id(java.util.UUID.randomUUID())
                .name("Test")
                .stravaAthleteId(99L)
                .stravaAccessToken(encryptionUtil.encrypt("old-token"))
                .stravaRefreshToken(encryptedRefresh)
                .stravaTokenExpires(Instant.now().minusSeconds(100))
                .build();

        String tokenResponse = """
                {
                  \"access_token\": \"new-access-token\",
                  \"refresh_token\": \"new-refresh-token\",
                  \"expires_at\": %d
                }
                """.formatted(Instant.now().plusSeconds(21600).getEpochSecond());

        when(restTemplate.postForObject(anyString(), any(), same(String.class)))
                .thenReturn(tokenResponse);
        when(profileRepository.save(any(AthleteProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        String token = service.getValidAccessToken(profile);
        assertThat(token).isEqualTo("new-access-token");
    }

    @Test
    void exchangeCodeSurfacesReadableStravaApiError() {
        when(restTemplate.postForObject(anyString(), any(), same(String.class)))
                .thenReturn("""
                        {
                          \"message\": \"Authorization code invalid\",
                          \"errors\": [
                            {
                              \"resource\": \"AuthorizationCode\",
                              \"field\": \"code\",
                              \"code\": \"invalid\"
                            }
                          ]
                        }
                        """);

        assertThatThrownBy(() -> service.exchangeCodeForTokens("bad-code", newOauthState()))
                .isInstanceOf(StravaApiException.class)
                .hasMessageContaining("Authorization code invalid");
    }

    private String newOauthState() {
        String url = service.getAuthorizationUrl();
        return url.substring(url.indexOf("&state=") + 7);
    }
}
