package pl.strava.analizator.infrastructure.web;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.DailyMetricsService;
import pl.strava.analizator.application.HeatmapBuildService;
import pl.strava.analizator.application.StravaConfigPort;
import pl.strava.analizator.application.dto.StravaConfigDto;
import pl.strava.analizator.infrastructure.weather.WeatherCacheScheduler;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StravaConfigPort stravaConfigProvider;
    private final WeatherCacheScheduler weatherCacheScheduler;
    private final HeatmapBuildService heatmapBuildService;
    private final DailyMetricsService dailyMetricsService;

    @GetMapping("/strava-config")
    public ResponseEntity<StravaConfigDto> getStravaConfig() {
        return ResponseEntity.ok(stravaConfigProvider.getCurrentConfig());
    }

    @PutMapping("/strava-config")
    public ResponseEntity<StravaConfigDto> updateStravaConfig(
            @RequestBody Map<String, String> body) {
        stravaConfigProvider.saveConfig(
                body.get("clientId"),
                body.get("clientSecret"),
                body.get("webhookToken")
        );
        return ResponseEntity.ok(stravaConfigProvider.getCurrentConfig());
    }

    @DeleteMapping("/strava-config")
    public ResponseEntity<StravaConfigDto> resetStravaConfig() {
        stravaConfigProvider.clearConfig();
        return ResponseEntity.ok(stravaConfigProvider.getCurrentConfig());
    }

    @GetMapping("/weather-job-status")
    public ResponseEntity<WeatherCacheScheduler.JobStatus> getWeatherJobStatus() {
        return ResponseEntity.ok(weatherCacheScheduler.getLastJobStatus());
    }

    @PostMapping("/heatmap/rebuild")
    public ResponseEntity<Map<String, String>> rebuildHeatmap() {
        heatmapBuildService.rebuildAll();
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Heatmap rebuilt successfully"));
    }

    @PostMapping("/ftp-history/rebuild")
    public ResponseEntity<Map<String, String>> rebuildFtpHistory() {
        dailyMetricsService.rebuildFtpHistory();
        return ResponseEntity.ok(Map.of("status", "ok", "message", "FTP history rebuilt successfully"));
    }
}
