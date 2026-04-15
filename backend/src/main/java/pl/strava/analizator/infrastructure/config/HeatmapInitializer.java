package pl.strava.analizator.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import pl.strava.analizator.application.HeatmapBuildService;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class HeatmapInitializer implements ApplicationRunner {

    private final HeatmapBuildService heatmapBuildService;
    private final HeatmapSegmentRepository heatmapSegmentRepository;
    private final ActivityRepository activityRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (heatmapSegmentRepository.count() == 0
                && activityRepository.countActivitiesWithPolylines() > 0) {
            log.info("Heatmap table is empty — triggering async rebuild on startup");
            heatmapBuildService.rebuildAll();
        }
    }
}
