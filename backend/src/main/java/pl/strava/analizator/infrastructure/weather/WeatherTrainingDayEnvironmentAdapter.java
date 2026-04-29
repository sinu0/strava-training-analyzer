package pl.strava.analizator.infrastructure.weather;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.WeatherGradientDto;
import pl.strava.analizator.application.dto.WeatherLocationDto;
import pl.strava.analizator.domain.model.TrainingDayEnvironment;
import pl.strava.analizator.domain.port.TrainingDayEnvironmentPort;

@Component
@RequiredArgsConstructor
public class WeatherTrainingDayEnvironmentAdapter implements TrainingDayEnvironmentPort {

    private final WeatherService weatherService;

    @Override
    public Optional<TrainingDayEnvironment> getEnvironmentFor(LocalDate date) {
        WeatherLocationDto activeLocation = weatherService.getActiveLocation();
        if (activeLocation == null) {
            return Optional.empty();
        }

        WeatherGradientDto gradient = weatherService.getWeatherGradient(activeLocation.getName());
        return gradient.getDays().stream()
                .filter(day -> LocalDate.parse(day.getDate()).isEqual(date))
                .findFirst()
                .map(day -> TrainingDayEnvironment.builder()
                        .date(date)
                        .locationName(activeLocation.getName())
                        .outdoorScore(day.getDailyScore())
                        .bestWindowScore(day.getBestWindowScore())
                        .weatherDescription(day.getWeatherDescription())
                        .build());
    }
}
