package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntervalDetectionDto {
    private int totalIntervalSessions;
    private Map<String, Integer> sessionsByType;
    private List<IntervalSessionDto> recentSessions;
    private double avgQualityScore;
    private String trend;
    private String recommendation;
}
