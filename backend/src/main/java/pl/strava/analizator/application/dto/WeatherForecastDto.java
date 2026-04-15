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
public class WeatherForecastDto {

    private WeatherDto current;
    private List<HourlySlot> hourly;
    private List<DailySlot> daily;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlySlot {
        private String time;
        private double temperature;
        private double windSpeed;
        private double precipitation;
        private int weatherCode;
        private String weatherDescription;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySlot {
        private String date;
        private double tempMin;
        private double tempMax;
        private double precipitationSum;
        private double windSpeedMax;
        private int weatherCode;
        private String weatherDescription;
    }
}
