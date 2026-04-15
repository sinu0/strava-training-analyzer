package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.GarminSyncService;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.vo.DateRange;
import pl.strava.analizator.infrastructure.config.EncryptionUtil;

@RestController
@RequestMapping("/api/garmin")
@RequiredArgsConstructor
public class GarminController {

    private final GarminSyncService garminSyncService;
    private final DailySummaryRepository dailySummaryRepository;
    private final EncryptionUtil encryptionUtil;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean hasCredentials = garminSyncService.hasCredentials();

        Map<String, Object> status = new java.util.HashMap<>();
        status.put("connected", hasCredentials);
        status.put("source", "garmin");
        status.put("email", null);
        status.put("lastSyncAt", null);
        status.put("lastError", null);

        if (hasCredentials) {
            garminSyncService.getGarminEmail().ifPresent(email -> status.put("email", email));
            garminSyncService.getLastSyncTimestamp().ifPresent(ts -> status.put("lastSyncAt", ts.toString()));
        }

        // surface the last terminal error (if any) to the admin/status UI
        garminSyncService.getLastGarminError().ifPresent(err -> status.put("lastError", err));

        return ResponseEntity.ok(status);
    }

    @PostMapping("/credentials")
    public ResponseEntity<Map<String, String>> saveCredentials(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email i hasło są wymagane"));
        }

        String encryptedPassword = encryptionUtil.encrypt(password);
        garminSyncService.saveCredentials(email, encryptedPassword);

        return ResponseEntity.ok(Map.of("status", "Dane logowania zostały zapisane"));
    }

    @DeleteMapping("/credentials")
    public ResponseEntity<Void> deleteCredentials() {
        garminSyncService.clearCredentials();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sync")
    public ResponseEntity<GarminSyncService.SyncResult> manualSync(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        GarminSyncService.SyncResult result = garminSyncService.syncHealthData(from, to);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health/{date}")
    public ResponseEntity<DailySummary> getHealthData(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return garminSyncService.getHealthData(date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/health/range")
    public ResponseEntity<List<DailySummary>> getHealthDataRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<DailySummary> data = dailySummaryRepository.findByDateRange(DateRange.of(from, to));
        return ResponseEntity.ok(data);
    }
}
