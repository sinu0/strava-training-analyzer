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
    private Integer estimatedTss;
    private Double estimatedIf;
    private String structure;
    private String rationale;
    private Integer roiScore;
    private String impact;
}
