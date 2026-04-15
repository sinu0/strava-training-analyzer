package pl.strava.analizator.infrastructure.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.DailyMetricsService;
import pl.strava.analizator.application.SyncService;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final DailyMetricsService dailyMetricsService;

    @PostMapping("/strava/full")
    public ResponseEntity<SyncService.SyncStatus> fullSync() {
        SyncService.SyncStatus status = syncService.syncFull();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(status);
    }

    @PostMapping("/strava/recent")
    public ResponseEntity<SyncService.SyncStatus> recentSync() {
        SyncService.SyncStatus status = syncService.syncRecent();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(status);
    }

    @PostMapping("/strava/photos")
    public ResponseEntity<SyncService.SyncStatus> syncActivityPhotos() {
        SyncService.SyncStatus status = syncService.syncActivityPhotos();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(status);
    }

    @PostMapping("/strava/resync-streams")
    public ResponseEntity<SyncService.SyncStatus> resyncStreams() {
        SyncService.SyncStatus status = syncService.resyncStreams();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(status);
    }

    @GetMapping("/status")
    public ResponseEntity<SyncService.SyncStatus> syncStatus() {
        return ResponseEntity.ok(syncService.getLastSyncStatus());
    }

    @DeleteMapping("/data")
    public ResponseEntity<Void> clearData() {
        syncService.clearAllData();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recalculate-metrics")
    public ResponseEntity<Void> recalculateMetrics() {
        dailyMetricsService.recalculateAll();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recalculate-activity-metrics")
    public ResponseEntity<Void> recalculateActivityMetrics() {
        syncService.recalculateAllActivityMetrics();
        return ResponseEntity.noContent().build();
    }
}
