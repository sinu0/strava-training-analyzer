package pl.strava.analizator.infrastructure.weather;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.application.dto.WeatherGradientDto;
import pl.strava.analizator.infrastructure.persistence.entity.WeatherCacheEntity;
import pl.strava.analizator.infrastructure.persistence.entity.WeatherLocationEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.WeatherCacheJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WeatherLocationJpaRepository;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private WeatherCacheJpaRepository cacheRepository;

    @Mock
    private WeatherLocationJpaRepository locationRepository;

    private WeatherService weatherService;

    @BeforeEach
    void setUp() {
        weatherService = new WeatherService(
                restTemplate,
                cacheRepository,
                locationRepository,
                new ObjectMapper()
        );
    }

    @Test
    void getWeatherGradient_enrichesCachedHoursWithSunriseAndSunset() {
        WeatherLocationEntity location = WeatherLocationEntity.builder()
                .id(UUID.randomUUID())
                .name("Kraków")
                .latitude(BigDecimal.valueOf(50.0614))
                .longitude(BigDecimal.valueOf(19.9366))
                .active(true)
                .createdAt(Instant.now())
                .build();

        WeatherCacheEntity cachedDay = WeatherCacheEntity.builder()
                .id(UUID.randomUUID())
                .locationName("Kraków")
                .latitude(BigDecimal.valueOf(50.0614))
                .longitude(BigDecimal.valueOf(19.9366))
                .forecastDate(LocalDate.now())
                .dailyScore((short) 82)
                .bestWindowStart("09:00")
                .bestWindowEnd("11:00")
                .bestWindowScore((short) 88)
                .tempMin(BigDecimal.TEN)
                .tempMax(BigDecimal.valueOf(19))
                .precipitationSum(BigDecimal.ZERO)
                .windSpeedMax(BigDecimal.valueOf(20))
                .weatherCode((short) 1)
                .hourlyScores("""
                        [{"hour":"09:00","score":88,"temperature":16.0,"windSpeed":12.0,"precipitation":0.0,"weatherCode":1}]
                        """)
                .computedAt(Instant.now())
                .build();

        when(locationRepository.findByName("Kraków")).thenReturn(Optional.of(location));
        when(cacheRepository.findByLocationNameAndForecastDateGreaterThanEqualOrderByForecastDateAsc(
                eq("Kraków"),
                eq(LocalDate.now())
        )).thenReturn(List.of(cachedDay));
        when(restTemplate.getForObject(anyString(), eq(Map.class), anyDouble(), anyDouble()))
                .thenAnswer(invocation -> {
                    String url = invocation.getArgument(0, String.class);
                    if (url.contains("&current=")) {
                        return Map.of(
                                "current", Map.of(
                                        "temperature_2m", 18.2,
                                        "wind_speed_10m", 16.0,
                                        "precipitation", 0.0,
                                        "weather_code", 1
                                )
                        );
                    }
                    if (url.contains("daily=sunrise,sunset")) {
                        return Map.of(
                                "daily", Map.of(
                                        "time", List.of(LocalDate.now().toString()),
                                        "sunrise", List.of(LocalDate.now() + "T06:12"),
                                        "sunset", List.of(LocalDate.now() + "T19:41")
                                )
                        );
                    }
                    return null;
                });

        WeatherGradientDto gradient = weatherService.getWeatherGradient("Kraków");

        assertThat(gradient.getDays()).singleElement().satisfies(day -> {
            assertThat(day.getHourlyScores()).singleElement().satisfies(hour -> {
                assertThat(hour.getSunrise()).isEqualTo("06:12");
                assertThat(hour.getSunset()).isEqualTo("19:41");
            });
        });
    }

    @Test
    void getWeatherPointGradient_buildsLiveGradientForClickedCoordinates() {
        when(restTemplate.getForObject(anyString(), eq(Map.class), anyDouble(), anyDouble()))
                .thenAnswer(invocation -> {
                    String url = invocation.getArgument(0, String.class);
                    if (url.contains("&current=") && url.contains("&hourly=")) {
                        return Map.of(
                                "current", Map.of(
                                        "temperature_2m", 19.5,
                                        "wind_speed_10m", 11.0,
                                        "precipitation", 0.0,
                                        "weather_code", 1
                                ),
                                "hourly", Map.of(
                                        "time", List.of(
                                                LocalDate.now() + "T00:00",
                                                LocalDate.now() + "T01:00",
                                                LocalDate.now() + "T02:00",
                                                LocalDate.now() + "T03:00",
                                                LocalDate.now() + "T04:00",
                                                LocalDate.now() + "T05:00",
                                                LocalDate.now() + "T06:00",
                                                LocalDate.now() + "T07:00",
                                                LocalDate.now() + "T08:00",
                                                LocalDate.now() + "T09:00",
                                                LocalDate.now() + "T10:00",
                                                LocalDate.now() + "T11:00",
                                                LocalDate.now() + "T12:00",
                                                LocalDate.now() + "T13:00",
                                                LocalDate.now() + "T14:00",
                                                LocalDate.now() + "T15:00",
                                                LocalDate.now() + "T16:00",
                                                LocalDate.now() + "T17:00",
                                                LocalDate.now() + "T18:00",
                                                LocalDate.now() + "T19:00",
                                                LocalDate.now() + "T20:00",
                                                LocalDate.now() + "T21:00",
                                                LocalDate.now() + "T22:00",
                                                LocalDate.now() + "T23:00"
                                        ),
                                        "temperature_2m", List.of(8, 8, 7, 7, 6, 7, 9, 11, 13, 15, 17, 18, 19, 20, 20, 19, 18, 16, 14, 12, 11, 10, 9, 8),
                                        "wind_speed_10m", List.of(7, 7, 6, 6, 6, 7, 8, 9, 10, 11, 12, 12, 13, 14, 14, 13, 12, 11, 10, 9, 8, 8, 7, 7),
                                        "precipitation", List.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
                                        "weather_code", List.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
                                ),
                                "daily", Map.of(
                                        "time", List.of(LocalDate.now().toString()),
                                        "temperature_2m_max", List.of(20.0),
                                        "temperature_2m_min", List.of(6.0),
                                        "precipitation_sum", List.of(0.0),
                                        "wind_speed_10m_max", List.of(14.0),
                                        "weather_code", List.of(1)
                                )
                        );
                    }
                    if (url.contains("daily=sunrise,sunset")) {
                        return Map.of(
                                "daily", Map.of(
                                        "time", List.of(LocalDate.now().toString()),
                                        "sunrise", List.of(LocalDate.now() + "T06:05"),
                                        "sunset", List.of(LocalDate.now() + "T19:48")
                                )
                        );
                    }
                    if (url.contains("&current=")) {
                        return Map.of(
                                "current", Map.of(
                                        "temperature_2m", 19.5,
                                        "wind_speed_10m", 11.0,
                                        "precipitation", 0.0,
                                        "weather_code", 1
                                )
                        );
                    }
                    return null;
                });

        WeatherGradientDto gradient = weatherService.getWeatherPointGradient(
                50.0614,
                19.9366,
                "Kliknięty punkt"
        );

        assertThat(gradient.getLocationName()).isEqualTo("Kliknięty punkt");
        assertThat(gradient.getCurrent().getTemperature()).isEqualTo(19.5);
        assertThat(gradient.getDays()).singleElement().satisfies(day -> {
            assertThat(day.getBestWindowStart()).isNotBlank();
            assertThat(day.getBestWindowEnd()).isNotBlank();
            assertThat(day.getBestWindowScore()).isPositive();
            assertThat(day.getHourlyScores()).hasSize(24);
            assertThat(day.getHourlyScores()).anySatisfy(hour -> {
                assertThat(hour.getSunrise()).isEqualTo("06:05");
                assertThat(hour.getSunset()).isEqualTo("19:48");
            });
        });
    }
}
