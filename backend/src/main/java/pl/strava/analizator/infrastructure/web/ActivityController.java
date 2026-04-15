package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ActivityService;
import pl.strava.analizator.application.SyncService;
import pl.strava.analizator.application.dto.ActivityHeatmapDto;
import pl.strava.analizator.application.dto.ActivityDetailDto;
import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.domain.vo.ActivityTimelineEntry;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;
    private final SyncService syncService;

    @GetMapping
    public ResponseEntity<ActivitySummaryPageDto> listActivities(
            @RequestParam(required = false) String sportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) Double minDistanceKm,
            @RequestParam(required = false) Double maxDistanceKm,
            @RequestParam(required = false) Integer minDurationMin,
            @RequestParam(required = false) Integer maxDurationMin,
            @RequestParam(required = false) Short minAvgPowerW,
            @RequestParam(required = false) Short maxAvgPowerW,
            @RequestParam(required = false) Short minAvgHr,
            @RequestParam(required = false) Short maxAvgHr,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int cappedSize = Math.min(size, 100);
        BigDecimal minDistM = minDistanceKm != null ? BigDecimal.valueOf(minDistanceKm * 1000) : null;
        BigDecimal maxDistM = maxDistanceKm != null ? BigDecimal.valueOf(maxDistanceKm * 1000) : null;
        Integer minTimeSec = minDurationMin != null ? minDurationMin * 60 : null;
        Integer maxTimeSec = maxDurationMin != null ? maxDurationMin * 60 : null;
        return ResponseEntity.ok(activityService.findAll(sportType, from, to,
                minDistM, maxDistM, minTimeSec, maxTimeSec, minAvgPowerW, maxAvgPowerW, minAvgHr, maxAvgHr,
                page, cappedSize));
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<ActivityTimelineEntry>> getTimeline() {
        return ResponseEntity.ok(activityService.getTimeline());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDetailDto> getActivity(@PathVariable UUID id) {
        return ResponseEntity.ok(activityService.findById(id));
    }

    @GetMapping("/{id}/map")
    public ResponseEntity<Map<String, Object>> getActivityMap(@PathVariable UUID id) {
        return ResponseEntity.ok(activityService.getActivityMapGeoJson(id));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<ActivityHeatmapDto> getActivityHeatmap() {
        return ResponseEntity.ok(activityService.getRouteHeatmap());
    }

    @PostMapping("/{id}/recalculate-metrics")
    public ResponseEntity<Void> recalculateActivityMetrics(@PathVariable UUID id) {
        syncService.recalculateActivityMetrics(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
