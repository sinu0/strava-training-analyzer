package pl.strava.analizator.infrastructure.delivery;

import java.util.List;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.WorkoutDeliveryCapability;
import pl.strava.analizator.domain.port.WorkoutDeliveryPort;

@Component
public class ConfiguredWorkoutDeliveryAdapter implements WorkoutDeliveryPort {

    @Override
    public List<WorkoutDeliveryCapability> capabilities() {
        return List.of(
                new WorkoutDeliveryCapability("DOWNLOAD_FIT", "AVAILABLE", null),
                new WorkoutDeliveryCapability("DOWNLOAD_ZWO", "AVAILABLE", null),
                new WorkoutDeliveryCapability("ON_DEVICE", "AVAILABLE", null),
                new WorkoutDeliveryCapability("GARMIN", "UNAVAILABLE",
                        "Wymaga aktywnego Garmin Connect Developer Program i OAuth 2.0"),
                new WorkoutDeliveryCapability("INTERVALS_ICU", "UNAVAILABLE",
                        "Integracja nie jest skonfigurowana"));
    }
}
