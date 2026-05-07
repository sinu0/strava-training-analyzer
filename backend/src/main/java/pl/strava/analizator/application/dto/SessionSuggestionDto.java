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
public class SessionSuggestionDto {
    private String type;
    private String label;
    private int durationMin;
    private int estimatedTss;
    private double estimatedIf;
    private String structure;
    private String rationale;
    private int roiScore;
    private String impact;
}
