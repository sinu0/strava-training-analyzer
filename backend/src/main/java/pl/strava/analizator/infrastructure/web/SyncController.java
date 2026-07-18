package pl.strava.analizator.infrastructure.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
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

    @GetMapping("/strava/check")
    public ResponseEntity<SyncService.NewActivitiesCheck> checkNewActivities() {
        return ResponseEntity.ok(syncService.checkForNewActivities());
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

    @GetMapping("/auto-sync-config")
    public ResponseEntity<SyncService.AutoSyncConfig> getAutoSyncConfig() {
        return ResponseEntity.ok(syncService.getAutoSyncConfig());
    }

    @PutMapping("/auto-sync-config")
    public ResponseEntity<SyncService.AutoSyncConfig> updateAutoSyncConfig(@RequestBody Map<String, Integer> body) {
        Integer minutes = body.get("intervalMinutes");
        if (minutes == null || minutes < 1 || minutes > 1440) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(syncService.updateAutoSyncConfig(minutes));
    }

    @DeleteMapping("/data")
    public ResponseEntity<Void> clearData() {
        // The legacy implementation removed only a subset of related records and could
        // fail mid-operation on foreign keys. Data removal is deliberately unavailable
        // until it is implemented as an explicit, backed-up processing job.
        return ResponseEntity.status(HttpStatus.GONE).build();
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
