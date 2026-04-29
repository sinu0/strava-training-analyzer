package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachMemoryPreferenceDto {
    private String suggestionType;
    private int acceptedCount;
    private int rejectedCount;
    private double acceptanceRate;
    private String guidance;
}
