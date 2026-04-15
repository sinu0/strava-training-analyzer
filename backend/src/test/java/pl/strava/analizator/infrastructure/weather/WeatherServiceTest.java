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
}
