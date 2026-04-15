package pl.strava.analizator.application.dto;

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
public class WeatherLocationDto {
    private String id;
    private String name;
    private double latitude;
    private double longitude;
    private boolean active;
}
