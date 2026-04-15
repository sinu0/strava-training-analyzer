package pl.strava.analizator.application;

import pl.strava.analizator.application.dto.StravaConfigDto;

public interface StravaConfigPort {

    StravaConfigDto getCurrentConfig();

    void saveConfig(String clientId, String clientSecret, String webhookToken);

    void clearConfig();
}
