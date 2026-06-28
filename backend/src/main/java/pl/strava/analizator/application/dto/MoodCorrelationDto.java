package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.Map;

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
public class MoodCorrelationDto {

    private int totalEntries;
    private Map<String, MoodMetric> byMood;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MoodMetric {
        private int count;
        private Double avgPower;
        private Double avgHeartRate;
        private Double avgTss;
        private Double avgDurationMinutes;
        private Double avgDistanceKm;
    }
}
