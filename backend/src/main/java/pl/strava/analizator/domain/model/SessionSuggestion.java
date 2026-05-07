package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SessionSuggestion {

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
