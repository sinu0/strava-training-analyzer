package pl.strava.analizator.infrastructure.weather;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.application.dto.WeatherDto;
import pl.strava.analizator.application.dto.WeatherForecastDto;
import pl.strava.analizator.application.dto.WeatherGradientDto;
import pl.strava.analizator.application.dto.WeatherLocationDto;
import pl.strava.analizator.infrastructure.persistence.entity.WeatherCacheEntity;
import pl.strava.analizator.infrastructure.persistence.entity.WeatherLocationEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.WeatherCacheJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WeatherLocationJpaRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate;
    private final WeatherCacheJpaRepository cacheRepository;
    private final WeatherLocationJpaRepository locationRepository;
    private final ObjectMapper objectMapper;

    private static final String OPEN_METEO_URL =
            "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            + "&current=temperature_2m,wind_speed_10m,precipitation,weather_code";

    private static final String OPEN_METEO_FORECAST_URL =
            "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            + "&current=temperature_2m,wind_speed_10m,precipitation,weather_code"
            + "&hourly=temperature_2m,wind_speed_10m,precipitation,weather_code"
            + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code"
            + "&forecast_days=8&timezone=auto";

    private static final String OPEN_METEO_SUN_TIMES_URL =
            "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            + "&daily=sunrise,sunset"
            + "&forecast_days=8&timezone=auto";

    /**
     * Fetch current weather from Open-Meteo API.
     * Default coordinates: Kraków, Poland (50.06, 19.94).
     */
    public WeatherDto getCurrentWeather(double latitude, double longitude) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    OPEN_METEO_URL, Map.class, latitude, longitude);

            if (response == null || !response.containsKey("current")) {
                return fallbackWeather();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> current = (Map<String, Object>) response.get("current");

            double temp = toDouble(current.get("temperature_2m"));
            double wind = toDouble(current.get("wind_speed_10m"));
            double precip = toDouble(current.get("precipitation"));
            int code = toInt(current.get("weather_code"));

            List<String> warnings = new ArrayList<>();

            // Wind chill / feels-like temperature (simplified formula)
            double feelsLike = temp;
            if (temp <= 10 && wind > 4.8) {
                feelsLike = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16)
                        + 0.3965 * temp * Math.pow(wind, 0.16);
            }

            // --- Temperature score (0-30 points, ideal 12-22°C) ---
            int tempScore;
            if (feelsLike >= 12 && feelsLike <= 22) {
                tempScore = 30; // ideal cycling range
            } else if (feelsLike >= 8 && feelsLike < 12) {
                tempScore = 20; // chilly but ok
            } else if (feelsLike > 22 && feelsLike <= 28) {
                tempScore = 20; // warm but ok
            } else if (feelsLike >= 3 && feelsLike < 8) {
                tempScore = 10; // cold
                warnings.add("Niska temperatura odczuwalna (" + Math.round(feelsLike) + "°C) — rozważ trenażer");
            } else if (feelsLike > 28 && feelsLike <= 35) {
                tempScore = 10; // hot
                warnings.add("Uwaga: upał (" + Math.round(temp) + "°C) — ryzyko przegrzania");
            } else if (feelsLike < 3) {
                tempScore = 0; // freezing
                warnings.add("Bardzo zimno (odczuwalne " + Math.round(feelsLike) + "°C) — zdecydowanie trenażer");
            } else {
                tempScore = 0; // extreme heat >35
                warnings.add("Uwaga: ekstremalny upał (" + Math.round(temp) + "°C)");
            }

            // --- Precipitation score (0-30 points) ---
            int precipScore;
            if (precip == 0 && code < 51) {
                precipScore = 30; // dry
            } else if (precip == 0 && code >= 51) {
                // weather code says precipitation but current measurement is 0
                precipScore = 20;
                warnings.add("Możliwe opady — " + describeWeatherCode(code));
            } else if (precip > 0 && precip <= 0.5) {
                precipScore = 10; // light drizzle
                warnings.add("Mżawka (" + precip + " mm) — mokro i nieprzyjemnie");
            } else if (precip > 0.5 && precip <= 2) {
                precipScore = 5; // rain
                warnings.add("Opady deszczu (" + precip + " mm) — śliska nawierzchnia");
            } else {
                precipScore = 0; // heavy rain
                warnings.add("Intensywne opady (" + precip + " mm) — lepiej zostać w domu");
            }

            // --- Wind score (0-20 points) ---
            int windScore;
            if (wind <= 10) {
                windScore = 20; // calm
            } else if (wind <= 20) {
                windScore = 12; // moderate
                warnings.add("Umiarkowany wiatr (" + Math.round(wind) + " km/h)");
            } else if (wind <= 30) {
                windScore = 5; // strong
                warnings.add("Silny wiatr (" + Math.round(wind) + " km/h) — utrudniona jazda");
            } else {
                windScore = 0; // dangerous
                warnings.add("Bardzo silny wiatr (" + Math.round(wind) + " km/h) — niebezpiecznie!");
            }

            // --- Weather code score (0-20 points) ---
            int codeScore;
            if (code <= 3) {
                codeScore = 20; // clear / cloudy
            } else if (code <= 48) {
                codeScore = 12; // fog
                if (code >= 45) warnings.add("Mgła — ograniczona widoczność");
            } else if (code <= 55) {
                codeScore = 5; // drizzle
            } else if (code <= 67) {
                codeScore = 2; // rain / freezing rain
            } else if (code <= 77) {
                codeScore = 0; // snow
                warnings.add("Opady śniegu — trening indoor");
            } else if (code <= 86) {
                codeScore = 2; // showers
            } else {
                codeScore = 0; // thunderstorm
                warnings.add("Burza — absolutnie nie wychodź na rower!");
            }

            int outdoorScore = tempScore + precipScore + windScore + codeScore;

            // Combined penalty: cold + wet is especially miserable
            if (feelsLike < 10 && precip > 0) {
                outdoorScore -= 10;
            }

            outdoorScore = Math.max(0, Math.min(100, outdoorScore));

            return WeatherDto.builder()
                    .temperature(temp)
                    .windSpeed(wind)
                    .precipitation(precip)
                    .weatherCode(code)
                    .weatherDescription(describeWeatherCode(code))
                    .outdoorScore(outdoorScore)
                    .warnings(warnings)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to fetch weather data: {}", e.getMessage());
            return fallbackWeather();
        }
    }

    /**
     * Fetch full forecast: current + 4 hourly slots (every 2h) + 7 daily slots.
     */
    @SuppressWarnings("unchecked")
    public WeatherForecastDto getWeatherForecast(double latitude, double longitude) {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    OPEN_METEO_FORECAST_URL, Map.class, latitude, longitude);

            if (response == null) {
                return WeatherForecastDto.builder()
                        .current(fallbackWeather())
                        .hourly(List.of())
                        .daily(List.of())
                        .build();
            }

            // Current weather
            WeatherDto current = getCurrentWeather(latitude, longitude);

            // Hourly forecast — pick 4 slots every 2h from current hour
            List<WeatherForecastDto.HourlySlot> hourly = new ArrayList<>();
            Map<String, Object> hourlyData = (Map<String, Object>) response.get("hourly");
            if (hourlyData != null) {
                List<String> times = (List<String>) hourlyData.get("time");
                List<Number> temps = (List<Number>) hourlyData.get("temperature_2m");
                List<Number> winds = (List<Number>) hourlyData.get("wind_speed_10m");
                List<Number> precips = (List<Number>) hourlyData.get("precipitation");
                List<Number> codes = (List<Number>) hourlyData.get("weather_code");

                if (times != null) {
                    // Find current hour index
                    String nowHour = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:00"));
                    int startIdx = 0;
                    for (int i = 0; i < times.size(); i++) {
                        if (times.get(i).equals(nowHour)) {
                            startIdx = i;
                            break;
                        }
                    }

                    // Pick 4 slots every 2 hours
                    for (int slot = 0; slot < 4; slot++) {
                        int idx = startIdx + (slot + 1) * 2;
                        if (idx >= times.size()) break;
                        int wCode = codes != null ? codes.get(idx).intValue() : 0;
                        hourly.add(WeatherForecastDto.HourlySlot.builder()
                                .time(times.get(idx))
                                .temperature(temps != null ? temps.get(idx).doubleValue() : 0)
                                .windSpeed(winds != null ? winds.get(idx).doubleValue() : 0)
                                .precipitation(precips != null ? precips.get(idx).doubleValue() : 0)
                                .weatherCode(wCode)
                                .weatherDescription(describeWeatherCode(wCode))
                                .build());
                    }
                }
            }

            // Daily forecast — 7 days (skip today = index 0)
            List<WeatherForecastDto.DailySlot> daily = new ArrayList<>();
            Map<String, Object> dailyData = (Map<String, Object>) response.get("daily");
            if (dailyData != null) {
                List<String> dates = (List<String>) dailyData.get("time");
                List<Number> maxTemps = (List<Number>) dailyData.get("temperature_2m_max");
                List<Number> minTemps = (List<Number>) dailyData.get("temperature_2m_min");
                List<Number> precipSums = (List<Number>) dailyData.get("precipitation_sum");
                List<Number> windMaxes = (List<Number>) dailyData.get("wind_speed_10m_max");
                List<Number> codes = (List<Number>) dailyData.get("weather_code");

                if (dates != null) {
                    for (int i = 1; i < Math.min(dates.size(), 8); i++) {
                        int wCode = codes != null ? codes.get(i).intValue() : 0;
                        daily.add(WeatherForecastDto.DailySlot.builder()
                                .date(dates.get(i))
                                .tempMax(maxTemps != null ? maxTemps.get(i).doubleValue() : 0)
                                .tempMin(minTemps != null ? minTemps.get(i).doubleValue() : 0)
                                .precipitationSum(precipSums != null ? precipSums.get(i).doubleValue() : 0)
                                .windSpeedMax(windMaxes != null ? windMaxes.get(i).doubleValue() : 0)
                                .weatherCode(wCode)
                                .weatherDescription(describeWeatherCode(wCode))
                                .build());
                    }
                }
            }

            return WeatherForecastDto.builder()
                    .current(current)
                    .hourly(hourly)
                    .daily(daily)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to fetch weather forecast: {}", e.getMessage());
            return WeatherForecastDto.builder()
                    .current(fallbackWeather())
                    .hourly(List.of())
                    .daily(List.of())
                    .build();
        }
    }

    // ===================== GRADIENT (from cache) =====================

    /**
     * Read pre-computed gradient data from cache for a location.
     * Returns current weather (live) + 7 days of gradient with hourly scores.
     */
    public WeatherGradientDto getWeatherGradient(String locationName) {
        WeatherLocationEntity loc = locationRepository.findByName(locationName)
                .orElseThrow(() -> new IllegalArgumentException("Unknown location: " + locationName));

        double lat = loc.getLatitude().doubleValue();
        double lon = loc.getLongitude().doubleValue();

        WeatherDto current = getCurrentWeather(lat, lon);

        List<WeatherCacheEntity> cached = cacheRepository
                .findByLocationNameAndForecastDateGreaterThanEqualOrderByForecastDateAsc(
                        locationName, LocalDate.now());
        Map<LocalDate, SunTimes> sunTimesByDate = fetchSunTimes(lat, lon);

        List<WeatherGradientDto.GradientDay> days = cached.stream().map(entity -> {
            List<WeatherGradientDto.HourScore> hourScores;
            try {
                hourScores = objectMapper.readValue(entity.getHourlyScores(),
                        new TypeReference<>() {});
            } catch (Exception e) {
                hourScores = List.of();
            }
            List<WeatherGradientDto.HourScore> enrichedHourScores =
                    enrichHoursWithSunTimes(hourScores, entity.getForecastDate(), sunTimesByDate);
            return WeatherGradientDto.GradientDay.builder()
                    .date(entity.getForecastDate().toString())
                    .dailyScore(entity.getDailyScore())
                    .bestWindowStart(entity.getBestWindowStart())
                    .bestWindowEnd(entity.getBestWindowEnd())
                    .bestWindowScore(entity.getBestWindowScore() != null ? entity.getBestWindowScore() : 0)
                    .tempMin(entity.getTempMin() != null ? entity.getTempMin().doubleValue() : 0)
                    .tempMax(entity.getTempMax() != null ? entity.getTempMax().doubleValue() : 0)
                    .precipitationSum(entity.getPrecipitationSum() != null ? entity.getPrecipitationSum().doubleValue() : 0)
                    .windSpeedMax(entity.getWindSpeedMax() != null ? entity.getWindSpeedMax().doubleValue() : 0)
                    .weatherCode(entity.getWeatherCode() != null ? entity.getWeatherCode() : 0)
                    .weatherDescription(describeWeatherCode(entity.getWeatherCode() != null ? entity.getWeatherCode() : 0))
                    .hourlyScores(enrichedHourScores)
                    .build();
        }).toList();

        return WeatherGradientDto.builder()
                .locationName(locationName)
                .current(current)
                .days(days)
                .build();
    }

    @SuppressWarnings("unchecked")
    public WeatherGradientDto getWeatherPointGradient(double latitude, double longitude, String label) {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    OPEN_METEO_FORECAST_URL, Map.class, latitude, longitude);

            if (response == null) {
                return WeatherGradientDto.builder()
                        .locationName(resolvePointLabel(label, latitude, longitude))
                        .current(fallbackWeather())
                        .days(List.of())
                        .build();
            }

            Map<String, Object> hourlyData = (Map<String, Object>) response.get("hourly");
            Map<String, Object> dailyData = (Map<String, Object>) response.get("daily");

            if (hourlyData == null || dailyData == null) {
                return WeatherGradientDto.builder()
                        .locationName(resolvePointLabel(label, latitude, longitude))
                        .current(getCurrentWeather(latitude, longitude))
                        .days(List.of())
                        .build();
            }

            List<String> times = (List<String>) hourlyData.get("time");
            List<Number> temps = (List<Number>) hourlyData.get("temperature_2m");
            List<Number> winds = (List<Number>) hourlyData.get("wind_speed_10m");
            List<Number> precips = (List<Number>) hourlyData.get("precipitation");
            List<Number> hourlyCodes = (List<Number>) hourlyData.get("weather_code");

            List<String> dates = (List<String>) dailyData.get("time");
            List<Number> maxTemps = (List<Number>) dailyData.get("temperature_2m_max");
            List<Number> minTemps = (List<Number>) dailyData.get("temperature_2m_min");
            List<Number> precipSums = (List<Number>) dailyData.get("precipitation_sum");
            List<Number> windMaxes = (List<Number>) dailyData.get("wind_speed_10m_max");
            List<Number> dailyCodes = (List<Number>) dailyData.get("weather_code");

            if (times == null || dates == null) {
                return WeatherGradientDto.builder()
                        .locationName(resolvePointLabel(label, latitude, longitude))
                        .current(getCurrentWeather(latitude, longitude))
                        .days(List.of())
                        .build();
            }

            Map<LocalDate, SunTimes> sunTimesByDate = fetchSunTimes(latitude, longitude);
            List<WeatherGradientDto.GradientDay> days = new ArrayList<>();

            for (int dayIndex = 0; dayIndex < dates.size(); dayIndex++) {
                LocalDate forecastDate = LocalDate.parse(dates.get(dayIndex));
                List<WeatherGradientDto.HourScore> hourScores = new ArrayList<>();
                int dayStartIndex = dayIndex * 24;

                for (int hourIndex = 0; hourIndex < 24; hourIndex++) {
                    int dataIndex = dayStartIndex + hourIndex;
                    if (dataIndex >= times.size()) {
                        break;
                    }

                    double temperature = temps.get(dataIndex).doubleValue();
                    double wind = winds.get(dataIndex).doubleValue();
                    double precipitation = precips.get(dataIndex).doubleValue();
                    int weatherCode = hourlyCodes.get(dataIndex).intValue();

                    hourScores.add(WeatherGradientDto.HourScore.builder()
                            .hour(String.format("%02d:00", hourIndex))
                            .score(calculateHourlyScore(temperature, wind, precipitation, weatherCode))
                            .temperature(temperature)
                            .windSpeed(wind)
                            .precipitation(precipitation)
                            .weatherCode(weatherCode)
                            .build());
                }

                int dayScore = (int) Math.round(hourScores.stream()
                        .filter(hourScore -> {
                            int hour = Integer.parseInt(hourScore.getHour().split(":")[0]);
                            return hour >= 6 && hour <= 22;
                        })
                        .mapToInt(WeatherGradientDto.HourScore::getScore)
                        .average()
                        .orElse(0));

                String bestStart = null;
                String bestEnd = null;
                int bestScore = 0;
                for (int hour = 6; hour <= 21; hour++) {
                    if (hour < hourScores.size() && hour + 1 < hourScores.size()) {
                        int windowScore = (hourScores.get(hour).getScore() + hourScores.get(hour + 1).getScore()) / 2;
                        if (windowScore > bestScore) {
                            bestScore = windowScore;
                            bestStart = hourScores.get(hour).getHour();
                            bestEnd = String.format("%02d:00", hour + 2);
                        }
                    }
                }

                days.add(WeatherGradientDto.GradientDay.builder()
                        .date(forecastDate.toString())
                        .dailyScore(dayScore)
                        .bestWindowStart(bestStart)
                        .bestWindowEnd(bestEnd)
                        .bestWindowScore(bestScore)
                        .tempMin(minTemps != null && dayIndex < minTemps.size() ? minTemps.get(dayIndex).doubleValue() : 0)
                        .tempMax(maxTemps != null && dayIndex < maxTemps.size() ? maxTemps.get(dayIndex).doubleValue() : 0)
                        .precipitationSum(precipSums != null && dayIndex < precipSums.size() ? precipSums.get(dayIndex).doubleValue() : 0)
                        .windSpeedMax(windMaxes != null && dayIndex < windMaxes.size() ? windMaxes.get(dayIndex).doubleValue() : 0)
                        .weatherCode(dailyCodes != null && dayIndex < dailyCodes.size() ? dailyCodes.get(dayIndex).intValue() : 0)
                        .weatherDescription(describeWeatherCode(dailyCodes != null && dayIndex < dailyCodes.size() ? dailyCodes.get(dayIndex).intValue() : 0))
                        .hourlyScores(enrichHoursWithSunTimes(hourScores, forecastDate, sunTimesByDate))
                        .build());
            }

            return WeatherGradientDto.builder()
                    .locationName(resolvePointLabel(label, latitude, longitude))
                    .current(getCurrentWeather(latitude, longitude))
                    .days(days)
                    .build();
        } catch (Exception exception) {
            log.warn("Failed to build point weather gradient: {}", exception.getMessage());
            return WeatherGradientDto.builder()
                    .locationName(resolvePointLabel(label, latitude, longitude))
                    .current(fallbackWeather())
                    .days(List.of())
                    .build();
        }
    }

    // ===================== LOCATION MANAGEMENT =====================

    public List<WeatherLocationDto> getAllLocations() {
        return locationRepository.findAllByOrderByNameAsc().stream()
                .map(this::toLocationDto)
                .toList();
    }

    public WeatherLocationDto getActiveLocation() {
        return locationRepository.findByActiveTrue()
                .map(this::toLocationDto)
                .orElse(null);
    }

    @Transactional
    public WeatherLocationDto addLocation(String name, double lat, double lon) {
        if (locationRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Location already exists: " + name);
        }
        boolean hasAny = !locationRepository.findAllByOrderByNameAsc().isEmpty();
        WeatherLocationEntity entity = WeatherLocationEntity.builder()
                .name(name)
                .latitude(BigDecimal.valueOf(lat))
                .longitude(BigDecimal.valueOf(lon))
                .active(!hasAny) // first location is automatically active
                .createdAt(Instant.now())
                .build();
        return toLocationDto(locationRepository.save(entity));
    }

    @Transactional
    public void deleteLocation(String name) {
        locationRepository.findByName(name).ifPresent(loc -> {
            locationRepository.delete(loc);
            // If deleted location was active, activate the first remaining
            if (loc.isActive()) {
                locationRepository.findAllByOrderByNameAsc().stream()
                        .findFirst()
                        .ifPresent(first -> {
                            first.setActive(true);
                            locationRepository.save(first);
                        });
            }
        });
    }

    @Transactional
    public WeatherLocationDto setActiveLocation(String name) {
        WeatherLocationEntity loc = locationRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Unknown location: " + name));
        locationRepository.deactivateAll();
        loc.setActive(true);
        return toLocationDto(locationRepository.save(loc));
    }

    private WeatherLocationDto toLocationDto(WeatherLocationEntity entity) {
        return WeatherLocationDto.builder()
                .id(entity.getId().toString())
                .name(entity.getName())
                .latitude(entity.getLatitude().doubleValue())
                .longitude(entity.getLongitude().doubleValue())
                .active(entity.isActive())
                .build();
    }

    private String resolvePointLabel(String label, double latitude, double longitude) {
        if (label != null && !label.isBlank()) {
            return label;
        }
        return String.format("%.4f, %.4f", latitude, longitude);
    }

    // ===================== HELPERS =====================

    private WeatherDto fallbackWeather() {
        return WeatherDto.builder()
                .temperature(0)
                .windSpeed(0)
                .precipitation(0)
                .weatherCode(-1)
                .weatherDescription("Brak danych pogodowych")
                .outdoorScore(50)
                .warnings(List.of("Nie udało się pobrać danych pogodowych"))
                .build();
    }

    private String describeWeatherCode(int code) {
        return switch (code) {
            case 0 -> "Bezchmurnie";
            case 1 -> "Przeważnie bezchmurnie";
            case 2 -> "Częściowe zachmurzenie";
            case 3 -> "Pochmurno";
            case 45, 48 -> "Mgła";
            case 51, 53, 55 -> "Mżawka";
            case 61, 63, 65 -> "Deszcz";
            case 66, 67 -> "Marznący deszcz";
            case 71, 73, 75 -> "Śnieg";
            case 77 -> "Krupa śnieżna";
            case 80, 81, 82 -> "Przelotne opady";
            case 85, 86 -> "Przelotne opady śniegu";
            case 95 -> "Burza";
            case 96, 99 -> "Burza z gradem";
            default -> "Nieznane warunki";
        };
    }

    @SuppressWarnings("unchecked")
    private Map<LocalDate, SunTimes> fetchSunTimes(double latitude, double longitude) {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    OPEN_METEO_SUN_TIMES_URL, Map.class, latitude, longitude);

            if (response == null) {
                return Map.of();
            }

            Map<String, Object> daily = (Map<String, Object>) response.get("daily");
            if (daily == null) {
                return Map.of();
            }

            List<String> dates = (List<String>) daily.get("time");
            List<String> sunrises = (List<String>) daily.get("sunrise");
            List<String> sunsets = (List<String>) daily.get("sunset");

            if (dates == null || sunrises == null || sunsets == null) {
                return Map.of();
            }

            int size = Math.min(dates.size(), Math.min(sunrises.size(), sunsets.size()));
            Map<LocalDate, SunTimes> result = new HashMap<>();
            for (int index = 0; index < size; index++) {
                result.put(
                        LocalDate.parse(dates.get(index)),
                        new SunTimes(
                                formatSunTime(sunrises.get(index)),
                                formatSunTime(sunsets.get(index))
                        )
                );
            }
            return result;
        } catch (Exception exception) {
            log.warn("Failed to fetch sunrise/sunset data: {}", exception.getMessage());
            return Map.of();
        }
    }

    private List<WeatherGradientDto.HourScore> enrichHoursWithSunTimes(
            List<WeatherGradientDto.HourScore> hourScores,
            LocalDate forecastDate,
            Map<LocalDate, SunTimes> sunTimesByDate) {
        SunTimes daySunTimes = sunTimesByDate.get(forecastDate);
        if (daySunTimes == null) {
            return hourScores;
        }

        return hourScores.stream()
                .map(hourScore -> withSunTimes(hourScore, daySunTimes))
                .toList();
    }

    private WeatherGradientDto.HourScore withSunTimes(
            WeatherGradientDto.HourScore hourScore,
            SunTimes sunTimes) {
        return WeatherGradientDto.HourScore.builder()
                .hour(hourScore.getHour())
                .score(hourScore.getScore())
                .temperature(hourScore.getTemperature())
                .windSpeed(hourScore.getWindSpeed())
                .precipitation(hourScore.getPrecipitation())
                .weatherCode(hourScore.getWeatherCode())
                .sunrise(hourScore.getSunrise() != null ? hourScore.getSunrise() : sunTimes.sunrise())
                .sunset(hourScore.getSunset() != null ? hourScore.getSunset() : sunTimes.sunset())
                .build();
    }

    private String formatSunTime(String value) {
        try {
            return LocalDateTime.parse(value).format(DateTimeFormatter.ofPattern("HH:mm"));
        } catch (DateTimeParseException exception) {
            return value;
        }
    }

    private double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return 0;
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        return -1;
    }

    private int calculateHourlyScore(double temp, double wind, double precip, int code) {
        double feelsLike = temp;
        if (temp <= 10 && wind > 4.8) {
            feelsLike = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16)
                    + 0.3965 * temp * Math.pow(wind, 0.16);
        }

        int tempScore;
        if (feelsLike >= 12 && feelsLike <= 22) tempScore = 30;
        else if (feelsLike >= 8 && feelsLike < 12) tempScore = 20;
        else if (feelsLike > 22 && feelsLike <= 28) tempScore = 20;
        else if (feelsLike >= 3 && feelsLike < 8) tempScore = 10;
        else if (feelsLike > 28 && feelsLike <= 35) tempScore = 10;
        else tempScore = 0;

        int precipScore;
        if (precip == 0 && code < 51) precipScore = 30;
        else if (precip == 0 && code >= 51) precipScore = 20;
        else if (precip > 0 && precip <= 0.5) precipScore = 10;
        else if (precip > 0.5 && precip <= 2) precipScore = 5;
        else precipScore = 0;

        int windScore;
        if (wind <= 10) windScore = 20;
        else if (wind <= 20) windScore = 12;
        else if (wind <= 30) windScore = 5;
        else windScore = 0;

        int codeScore;
        if (code <= 3) codeScore = 20;
        else if (code <= 48) codeScore = 12;
        else if (code <= 55) codeScore = 5;
        else if (code <= 67) codeScore = 2;
        else if (code <= 77) codeScore = 0;
        else if (code <= 86) codeScore = 2;
        else codeScore = 0;

        int total = tempScore + precipScore + windScore + codeScore;
        if (feelsLike < 10 && precip > 0) {
            total -= 10;
        }
        return Math.max(0, Math.min(100, total));
    }

    private record SunTimes(String sunrise, String sunset) {}
}
