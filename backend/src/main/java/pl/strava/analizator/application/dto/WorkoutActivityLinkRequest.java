package pl.strava.analizator.application.dto;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkoutActivityLinkRequest {
    private UUID activityId;
}
