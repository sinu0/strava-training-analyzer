package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSessionFeedbackRequest {
    private int rpe;
    private String subjectiveFeedback;
    private double executionQuality;
    private boolean completed;
    private double actualTss;
    private double actualDurationMinutes;
    private String plannedType;
}
