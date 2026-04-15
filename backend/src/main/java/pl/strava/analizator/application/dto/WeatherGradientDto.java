package pl.strava.analizator.application.dto;

import java.util.List;

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
public class WeatherGradientDto {

    private String locationName;
    private WeatherDto current;
    private List<GradientDay> days;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradientDay {
        private String date;
        private int dailyScore;
        private String bestWindowStart;
        private String bestWindowEnd;
        private int bestWindowScore;
        private double tempMin;
        private double tempMax;
        private double precipitationSum;
        private double windSpeedMax;
        private int weatherCode;
        private String weatherDescription;
        private List<HourScore> hourlyScores;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourScore {
        private String hour;
        private int score;
        private double temperature;
        private double windSpeed;
        private double precipitation;
        private int weatherCode;
        private String sunrise;
        private String sunset;
    }
}
