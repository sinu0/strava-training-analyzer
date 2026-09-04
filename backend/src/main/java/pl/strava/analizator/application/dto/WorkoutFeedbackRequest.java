package pl.strava.analizator.application.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkoutFeedbackRequest {
    private Integer rpe;
    private String feeling;
    private String notes;
}
