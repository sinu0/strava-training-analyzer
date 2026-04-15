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
public class WeatherDto {

    private double temperature;
    private double windSpeed;
    private double precipitation;
    private int weatherCode;
    private String weatherDescription;
    private int outdoorScore;
    private List<String> warnings;
}
