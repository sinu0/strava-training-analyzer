package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.ai.CustomPrompt;

public interface CustomPromptPort {

    List<CustomPrompt> findAll();

    List<CustomPrompt> findByType(String predictionType);

    Optional<CustomPrompt> findById(UUID id);

    Optional<CustomPrompt> findActiveByType(String predictionType);

    CustomPrompt save(CustomPrompt prompt);

    void deleteById(UUID id);
}
