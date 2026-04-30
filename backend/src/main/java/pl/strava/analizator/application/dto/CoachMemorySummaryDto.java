package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachMemorySummaryDto {
    private String headline;
    private String coachNote;
    private List<CoachMemoryPreferenceDto> preferences;
}
