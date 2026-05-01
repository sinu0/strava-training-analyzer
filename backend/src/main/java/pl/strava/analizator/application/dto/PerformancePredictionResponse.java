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
public class PerformancePredictionResponse {
    private String formState;
    private int readinessScore;
    private PeakWindowDto peakWindow;
    private PerformanceDto performancePrediction;
    private List<String> recommendations;
    private int confidence;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeakWindowDto {
        private int startInDays;
        private int durationDays;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceDto {
        private int ftp;
        private int power20min;
    }
}
