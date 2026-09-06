package pl.strava.analizator.domain.port;

import java.util.Optional;
import pl.strava.analizator.domain.model.TrainingPreferences;

public interface TrainingPreferencesRepository {
    Optional<TrainingPreferences> find();
    TrainingPreferences save(TrainingPreferences preferences);
}
