package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WorkoutDeliveryCapability {
    private final String method;
    private final String status;
    private final String reason;
}
