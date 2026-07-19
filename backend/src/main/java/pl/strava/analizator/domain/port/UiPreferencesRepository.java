package pl.strava.analizator.domain.port;

import java.util.Optional;

import pl.strava.analizator.domain.model.UiPreferences;

public interface UiPreferencesRepository {
    Optional<UiPreferences> find();
    UiPreferences save(UiPreferences preferences);
}
