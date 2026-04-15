package pl.strava.analizator.infrastructure.weather;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.application.dto.WeatherGradientDto;
import pl.strava.analizator.infrastructure.persistence.entity.WeatherCacheEntity;
import pl.strava.analizator.infrastructure.persistence.entity.WeatherLocationEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.WeatherCacheJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WeatherLocationJpaRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherCacheScheduler {

    private final RestTemplate restTemplate;
    private final WeatherCacheJpaRepository cacheRepository;
    private final WeatherLocationJpaRepository locationRepository;
    private final WeatherService weatherService;
    private final ObjectMapper objectMapper;

    private volatile JobStatus lastJobStatus = new JobStatus("idle", null, 0, 0, null);

    public record JobStatus(
            String status,
            Instant lastRunAt,
            int locationsProcessed,
            int locationsFailed,
            String errorMessage
    ) {}

    public JobStatus getLastJobStatus() {
        return lastJobStatus;
    }

    private static final String HOURLY_FORECAST_URL =
            "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            + "&hourly=temperature_2m,wind_speed_10m,precipitation,weather_code"
            + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code"
            + "&forecast_days=8&timezone=Europe/Warsaw";

    /**
     * Runs at 06:00 and 18:00 daily. Fetches 8-day hourly forecast for each
     * user-saved location, computes outdoor cycling scores per hour,
     * finds best 2h window, saves to DB.
     */
    @Scheduled(cron = "0 0 6,18 * * *")
    @Transactional
    public void refreshWeatherCache() {
        List<WeatherLocationEntity> locations = locationRepository.findAllByOrderByNameAsc();
        log.info("Starting weather cache refresh for {} user locations", locations.size());

        lastJobStatus = new JobStatus("in_progress", Instant.now(), 0, 0, null);

        // Cleanup old data (> 2 days in past)
        cacheRepository.deleteByForecastDateBefore(LocalDate.now().minusDays(2));

        int processed = 0;
        int failed = 0;
        String lastError = null;

        for (WeatherLocationEntity loc : locations) {
            try {
                processLocation(loc.getName(),
                        loc.getLatitude().doubleValue(),
                        loc.getLongitude().doubleValue());
                processed++;
            } catch (Exception e) {
                log.warn("Failed to process weather for {}: {}", loc.getName(), e.getMessage());
                failed++;
                lastError = loc.getName() + ": " + e.getMessage();
            }
        }

        if (failed == 0) {
            lastJobStatus = new JobStatus("success", Instant.now(), processed, 0, null);
        } else {
            lastJobStatus = new JobStatus("partial_failure", Instant.now(), processed, failed, lastError);
        }
        log.info("Weather cache refresh completed: {} processed, {} failed", processed, failed);
    }

    /**
     * On-demand refresh for a single location (called from controller when adding/refreshing).
     */
    @Transactional
    public void refreshLocation(String locationName) {
        locationRepository.findByName(locationName).ifPresent(loc ->
                processLocation(loc.getName(),
                        loc.getLatitude().doubleValue(),
                        loc.getLongitude().doubleValue()));
    }

    @SuppressWarnings("unchecked")
    private void processLocation(String locationName, double lat, double lon) {
        Map<String, Object> response = restTemplate.getForObject(
                HOURLY_FORECAST_URL, Map.class, lat, lon);

        if (response == null) return;

        Map<String, Object> hourlyData = (Map<String, Object>) response.get("hourly");
        Map<String, Object> dailyData = (Map<String, Object>) response.get("daily");

        if (hourlyData == null || dailyData == null) return;

        List<String> times = (List<String>) hourlyData.get("time");
        List<Number> temps = (List<Number>) hourlyData.get("temperature_2m");
        List<Number> winds = (List<Number>) hourlyData.get("wind_speed_10m");
        List<Number> precips = (List<Number>) hourlyData.get("precipitation");
        List<Number> hCodes = (List<Number>) hourlyData.get("weather_code");

        List<String> dates = (List<String>) dailyData.get("time");
        List<Number> maxTemps = (List<Number>) dailyData.get("temperature_2m_max");
        List<Number> minTemps = (List<Number>) dailyData.get("temperature_2m_min");
        List<Number> precipSums = (List<Number>) dailyData.get("precipitation_sum");
        List<Number> windMaxes = (List<Number>) dailyData.get("wind_speed_10m_max");
        List<Number> dCodes = (List<Number>) dailyData.get("weather_code");

        if (times == null || dates == null) return;

        // Group hourly data by date
        for (int d = 0; d < dates.size(); d++) {
            String dateStr = dates.get(d);
            LocalDate forecastDate = LocalDate.parse(dateStr);

            // Collect hourly scores for this day (24 hours)
            List<WeatherGradientDto.HourScore> hourScores = new ArrayList<>();
            int dayStartIdx = d * 24;

            for (int h = 0; h < 24; h++) {
                int idx = dayStartIdx + h;
                if (idx >= times.size()) break;

                double temp = temps.get(idx).doubleValue();
                double wind = winds.get(idx).doubleValue();
                double precip = precips.get(idx).doubleValue();
                int code = hCodes.get(idx).intValue();

                int score = calculateHourlyScore(temp, wind, precip, code);

                hourScores.add(WeatherGradientDto.HourScore.builder()
                        .hour(String.format("%02d:00", h))
                        .score(score)
                        .temperature(temp)
                        .windSpeed(wind)
                        .precipitation(precip)
                        .weatherCode(code)
                        .build());
            }

            // Calculate daily average score (use hours 6-22 for cycling relevance)
            int dayScore = (int) Math.round(hourScores.stream()
                    .filter(hs -> {
                        int hr = Integer.parseInt(hs.getHour().split(":")[0]);
                        return hr >= 6 && hr <= 22;
                    })
                    .mapToInt(WeatherGradientDto.HourScore::getScore)
                    .average()
                    .orElse(0));

            // Find best 2h consecutive window
            String bestStart = null;
            String bestEnd = null;
            int bestScore = 0;
            for (int h = 6; h <= 21; h++) {
                if (h < hourScores.size() && h + 1 < hourScores.size()) {
                    int windowScore = (hourScores.get(h).getScore() + hourScores.get(h + 1).getScore()) / 2;
                    if (windowScore > bestScore) {
                        bestScore = windowScore;
                        bestStart = hourScores.get(h).getHour();
                        bestEnd = String.format("%02d:00", h + 2);
                    }
                }
            }

            // Serialize hourly scores to JSON
            String hourlyJson;
            try {
                hourlyJson = objectMapper.writeValueAsString(hourScores);
            } catch (JsonProcessingException e) {
                hourlyJson = "[]";
            }

            int wCode = dCodes.get(d).intValue();

            // Upsert: find existing or create new
            List<WeatherCacheEntity> existing = cacheRepository
                    .findByLocationNameAndForecastDateGreaterThanEqualOrderByForecastDateAsc(
                            locationName, forecastDate);

            WeatherCacheEntity entity = existing.stream()
                    .filter(e -> e.getForecastDate().equals(forecastDate))
                    .findFirst()
                    .orElse(WeatherCacheEntity.builder()
                            .locationName(locationName)
                            .latitude(BigDecimal.valueOf(lat))
                            .longitude(BigDecimal.valueOf(lon))
                            .forecastDate(forecastDate)
                            .build());

            entity.setDailyScore((short) dayScore);
            entity.setBestWindowStart(bestStart);
            entity.setBestWindowEnd(bestEnd);
            entity.setBestWindowScore(bestScore > 0 ? (short) bestScore : null);
            entity.setTempMin(BigDecimal.valueOf(minTemps.get(d).doubleValue()));
            entity.setTempMax(BigDecimal.valueOf(maxTemps.get(d).doubleValue()));
            entity.setPrecipitationSum(BigDecimal.valueOf(precipSums.get(d).doubleValue()));
            entity.setWindSpeedMax(BigDecimal.valueOf(windMaxes.get(d).doubleValue()));
            entity.setWeatherCode((short) wCode);
            entity.setHourlyScores(hourlyJson);
            entity.setComputedAt(Instant.now());

            cacheRepository.save(entity);
        }

        log.info("Cached {} days of weather for {}", dates.size(), locationName);
    }

    /**
     * Same component-based scoring algorithm as WeatherService.getCurrentWeather,
     * but simplified for hourly data (no warnings needed).
     */
    int calculateHourlyScore(double temp, double wind, double precip, int code) {
        // Wind chill
        double feelsLike = temp;
        if (temp <= 10 && wind > 4.8) {
            feelsLike = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16)
                    + 0.3965 * temp * Math.pow(wind, 0.16);
        }

        // Temperature score (0-30)
        int tempScore;
        if (feelsLike >= 12 && feelsLike <= 22) tempScore = 30;
        else if (feelsLike >= 8 && feelsLike < 12) tempScore = 20;
        else if (feelsLike > 22 && feelsLike <= 28) tempScore = 20;
        else if (feelsLike >= 3 && feelsLike < 8) tempScore = 10;
        else if (feelsLike > 28 && feelsLike <= 35) tempScore = 10;
        else tempScore = 0;

        // Precipitation score (0-30)
        int precipScore;
        if (precip == 0 && code < 51) precipScore = 30;
        else if (precip == 0 && code >= 51) precipScore = 20;
        else if (precip > 0 && precip <= 0.5) precipScore = 10;
        else if (precip > 0.5 && precip <= 2) precipScore = 5;
        else precipScore = 0;

        // Wind score (0-20)
        int windScore;
        if (wind <= 10) windScore = 20;
        else if (wind <= 20) windScore = 12;
        else if (wind <= 30) windScore = 5;
        else windScore = 0;

        // Weather code score (0-20)
        int codeScore;
        if (code <= 3) codeScore = 20;
        else if (code <= 48) codeScore = 12;
        else if (code <= 55) codeScore = 5;
        else if (code <= 67) codeScore = 2;
        else if (code <= 77) codeScore = 0;
        else if (code <= 86) codeScore = 2;
        else codeScore = 0;

        int total = tempScore + precipScore + windScore + codeScore;

        // Cold + wet combo penalty
        if (feelsLike < 10 && precip > 0) {
            total -= 10;
        }

        return Math.max(0, Math.min(100, total));
    }
}
