package pl.strava.analizator.infrastructure.strava;

import java.time.Instant;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.StravaConfigPort;
import pl.strava.analizator.application.dto.StravaConfigDto;
import pl.strava.analizator.infrastructure.config.EncryptionUtil;
import pl.strava.analizator.infrastructure.persistence.entity.AppConfigEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AppConfigJpaRepository;
import pl.strava.analizator.infrastructure.strava.StravaProperties;

/**
 * Provides Strava configuration values.
 * Checks the app_config DB table first; falls back to StravaProperties (env vars).
 */
@Component
@RequiredArgsConstructor
public class StravaConfigProvider implements StravaConfigPort {

    private static final String KEY_CLIENT_ID = "strava.client_id";
    private static final String KEY_CLIENT_SECRET = "strava.client_secret";
    private static final String KEY_WEBHOOK_TOKEN = "strava.webhook_verify_token";

    private final StravaProperties stravaProperties;
    private final AppConfigJpaRepository configRepository;
    private final EncryptionUtil encryptionUtil;

    public String clientId() {
        return dbValueOrDefault(KEY_CLIENT_ID, false, stravaProperties.clientId());
    }

    public String clientSecret() {
        return dbValueOrDefault(KEY_CLIENT_SECRET, true, stravaProperties.clientSecret());
    }

    public String webhookVerifyToken() {
        return dbValueOrDefault(KEY_WEBHOOK_TOKEN, true, stravaProperties.webhookVerifyToken());
    }

    public String redirectUri() {
        return stravaProperties.redirectUri();
    }

    public String authorizationUrl() {
        return "https://www.strava.com/oauth/authorize"
                + "?client_id=" + clientId()
                + "&redirect_uri=" + redirectUri()
                + "&response_type=code"
                + "&scope=read,activity:read_all,profile:read_all";
    }

    public String tokenUrl() {
        return stravaProperties.tokenUrl();
    }

    public String apiBaseUrl() {
        return stravaProperties.apiBaseUrl();
    }

    /**
     * Returns current config with masked secrets and source indicators.
     */
    @Override
    public StravaConfigDto getCurrentConfig() {
        String clientIdVal = resolveValue(KEY_CLIENT_ID, false);
        String clientSecretVal = resolveValue(KEY_CLIENT_SECRET, true);
        String webhookTokenVal = resolveValue(KEY_WEBHOOK_TOKEN, true);

        boolean clientIdFromDb = clientIdVal != null;
        boolean clientSecretFromDb = clientSecretVal != null;
        boolean webhookTokenFromDb = webhookTokenVal != null;

        String effectiveClientId = clientIdFromDb ? clientIdVal : stravaProperties.clientId();
        boolean hasClientSecret = clientSecretFromDb
                ? clientSecretVal != null && !clientSecretVal.isBlank()
                : stravaProperties.clientSecret() != null && !stravaProperties.clientSecret().isBlank();
        boolean hasWebhookToken = webhookTokenFromDb
                ? webhookTokenVal != null && !webhookTokenVal.isBlank()
                : stravaProperties.webhookVerifyToken() != null && !stravaProperties.webhookVerifyToken().isBlank();

        return new StravaConfigDto(
                effectiveClientId != null ? effectiveClientId : "",
                clientIdFromDb ? "db" : "env",
                hasClientSecret,
                clientSecretFromDb ? "db" : "env",
                hasWebhookToken,
                webhookTokenFromDb ? "db" : "env"
        );
    }

    @Transactional
    @Override
    public void saveConfig(String clientId, String clientSecret, String webhookToken) {
        if (clientId != null) {
            upsert(KEY_CLIENT_ID, clientId, false);
        }
        if (clientSecret != null && !clientSecret.isBlank()) {
            upsert(KEY_CLIENT_SECRET, clientSecret, true);
        }
        if (webhookToken != null && !webhookToken.isBlank()) {
            upsert(KEY_WEBHOOK_TOKEN, webhookToken, true);
        }
    }

    @Transactional
    @Override
    public void clearConfig() {
        configRepository.findByConfigKey(KEY_CLIENT_ID).ifPresent(configRepository::delete);
        configRepository.findByConfigKey(KEY_CLIENT_SECRET).ifPresent(configRepository::delete);
        configRepository.findByConfigKey(KEY_WEBHOOK_TOKEN).ifPresent(configRepository::delete);
    }

    private String dbValueOrDefault(String key, boolean encrypted, String defaultValue) {
        String dbVal = resolveValue(key, encrypted);
        if (dbVal != null && !dbVal.isBlank()) {
            return dbVal;
        }
        return defaultValue;
    }

    private String resolveValue(String key, boolean encrypted) {
        return configRepository.findByConfigKey(key)
                .map(entity -> {
                    String raw = entity.getConfigValue();
                    if (raw == null || raw.isBlank()) return null;
                    return entity.isEncrypted() ? encryptionUtil.decrypt(raw) : raw;
                })
                .orElse(null);
    }

    private void upsert(String key, String value, boolean encrypted) {
        AppConfigEntity entity = configRepository.findByConfigKey(key)
                .orElse(AppConfigEntity.builder()
                        .configKey(key)
                        .encrypted(encrypted)
                        .build());
        entity.setConfigValue(encrypted ? encryptionUtil.encrypt(value) : value);
        entity.setEncrypted(encrypted);
        entity.setUpdatedAt(Instant.now());
        configRepository.save(entity);
    }
}
