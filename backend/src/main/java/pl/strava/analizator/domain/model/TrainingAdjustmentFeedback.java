package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingAdjustmentFeedback {
    private UUID id;
    private LocalDate date;
    private UUID planId;
    private String suggestionType;
    private String suggestionTitle;
    private AdjustmentFeedbackDecision decision;
    private OffsetDateTime createdAt;
}
