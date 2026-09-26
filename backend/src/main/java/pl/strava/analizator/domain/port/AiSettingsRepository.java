package pl.strava.analizator.domain.port;

import java.util.Optional;

import pl.strava.analizator.domain.ai.AiSettings;

public interface AiSettingsRepository {
    Optional<AiSettings> find();
    AiSettings save(AiSettings settings);
}
