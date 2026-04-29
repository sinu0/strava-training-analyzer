package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordAdjustmentFeedbackRequest {
    private LocalDate date;
    private UUID planId;
    private String suggestionType;
    private String suggestionTitle;
    private String feedback;
}
