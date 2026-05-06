package pl.strava.analizator.infrastructure.web;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import pl.strava.analizator.application.WorkoutEvaluationService;
import pl.strava.analizator.application.dto.StravaConfigDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityTrainingEffect;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.infrastructure.weather.WeatherCacheScheduler;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final StravaConfigPort stravaConfigProvider;
    private final WeatherCacheScheduler weatherCacheScheduler;
    private final HeatmapBuildService heatmapBuildService;
    private final DailyMetricsService dailyMetricsService;
    private final ActivityRepository activityRepository;
    private final ActivityTrainingEffectRepository trainingEffectRepository;
    private final WorkoutEvaluationService workoutEvaluationService;
    private final AthleteProfileRepository profileRepository;
    private final DailySummaryRepository dailySummaryRepository;

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

    @PostMapping("/recalculate-all-training-effects")
    public ResponseEntity<Map<String, Object>> recalculateAllTrainingEffects() {
        AthleteProfile profile = profileRepository.findFirst().orElse(null);
        var activities = activityRepository.findAll();
        int success = 0;
        int failed = 0;
        for (Activity activity : activities) {
            try {
                DailySummary daySummary = null;
                if (activity.getStartedAt() != null) {
                    daySummary = dailySummaryRepository.findByDate(
                            activity.getStartedAt().toLocalDate()).orElse(null);
                }
                ActivityTrainingEffect effect = workoutEvaluationService
                        .calculateTrainingEffect(activity, profile, daySummary);
                trainingEffectRepository.save(effect);
                success++;
            } catch (Exception e) {
                log.warn("Failed to calculate training effect for activity {}: {}",
                        activity.getId(), e.getMessage());
                failed++;
            }
        }
        log.info("Recalculated training effects: {}/{} succeeded", success, success + failed);
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "total", success + failed,
                "success", success,
                "failed", failed
        ));
    }
}
