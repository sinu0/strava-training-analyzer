package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.HealthService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;

    @GetMapping("/overview")
    public ResponseEntity<HealthService.HealthOverview> getOverview(
            @RequestParam(defaultValue = "30") int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days);
        return ResponseEntity.ok(healthService.getOverview(from, to));
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<HealthService.HealthDay>> getTimeline(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(healthService.getHealthTimeline(from, to));
    }

    @GetMapping("/recovery")
    public ResponseEntity<HealthService.RecoveryStatus> getRecoveryStatus() {
        return ResponseEntity.ok(healthService.getRecoveryStatus(LocalDate.now()));
    }

    @PutMapping("/metrics")
    public ResponseEntity<Void> updateMetrics(@RequestBody Map<String, Object> body) {
        healthService.updateHealthMetrics(body);
        return ResponseEntity.noContent().build();
    }
}
