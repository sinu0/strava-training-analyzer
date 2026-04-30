package pl.strava.analizator.domain.port;

import java.time.LocalDate;
import java.util.Optional;

import pl.strava.analizator.domain.model.TrainingDayEnvironment;

public interface TrainingDayEnvironmentPort {
    Optional<TrainingDayEnvironment> getEnvironmentFor(LocalDate date);
}
