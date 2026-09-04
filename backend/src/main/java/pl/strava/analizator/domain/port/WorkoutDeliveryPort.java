package pl.strava.analizator.domain.port;

import java.util.List;

import pl.strava.analizator.domain.model.WorkoutDeliveryCapability;

public interface WorkoutDeliveryPort {
    List<WorkoutDeliveryCapability> capabilities();
}
