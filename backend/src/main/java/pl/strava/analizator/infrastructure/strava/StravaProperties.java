package pl.strava.analizator.infrastructure.strava;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "strava")
public record StravaProperties(
        String clientId,
        String clientSecret,
        String redirectUri,
        String webhookVerifyToken
) {

    private static final String AUTH_URL = "https://www.strava.com/oauth/authorize";
    private static final String TOKEN_URL = "https://www.strava.com/oauth/token";
    private static final String API_BASE_URL = "https://www.strava.com/api/v3";

    public String authorizationUrl() {
        return AUTH_URL + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code"
                + "&scope=read,activity:read_all,profile:read_all";
    }

    public String tokenUrl() {
        return TOKEN_URL;
    }

    public String apiBaseUrl() {
        return API_BASE_URL;
    }
}
