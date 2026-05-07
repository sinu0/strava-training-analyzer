package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.BlockHealthService;
import pl.strava.analizator.application.TrainingStatusService;
import pl.strava.analizator.application.dto.BlockHealthDto;
import pl.strava.analizator.application.dto.DailyOptimalLoadDto;
import pl.strava.analizator.application.dto.DurabilityInsightDto;
import pl.strava.analizator.application.dto.FtpProgressDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.PowerCurveDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.SaveReadinessCheckInRequest;
import pl.strava.analizator.application.dto.TrainingStatusDto;
import pl.strava.analizator.application.dto.TrendDto;
import pl.strava.analizator.application.dto.WeeklyBriefDto;
import pl.strava.analizator.application.dto.WeeklyMmpDto;
import pl.strava.analizator.application.dto.WeeklyOptimalLoadDto;
import pl.strava.analizator.application.dto.WeeklySummaryDto;
import pl.strava.analizator.application.dto.ZoneDistributionDto;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final BlockHealthService blockHealthService;
    private final TrainingStatusService trainingStatusService;

    @GetMapping("/pmc")
    public ResponseEntity<List<PmcDataDto>> getPmc(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be before 'to'");
        }
        return ResponseEntity.ok(analyticsService.getPmc(from, to));
    }

    @GetMapping("/power-curve")
    public ResponseEntity<PowerCurveDto> getPowerCurve(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be before 'to'");
        }
        return ResponseEntity.ok(analyticsService.getPowerCurve(from, to));
    }

    @GetMapping("/weekly-mmp")
    public ResponseEntity<List<WeeklyMmpDto>> getWeeklyMmp(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be before 'to'");
        }
        return ResponseEntity.ok(analyticsService.getWeeklyMmp(from, to));
    }

    @GetMapping("/zones")
    public ResponseEntity<ZoneDistributionDto> getZoneDistribution(
            @RequestParam(defaultValue = "power") String zoneType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be before 'to'");
        }
        return ResponseEntity.ok(analyticsService.getZoneDistribution(zoneType, from, to));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeeklySummaryDto>> getWeeklySummaries(
            @RequestParam(defaultValue = "8") int weeks) {
        return ResponseEntity.ok(analyticsService.getWeeklySummaries(weeks));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(analyticsService.getSummary(period));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<TrendDto>> getTrends(
            @RequestParam String metric,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be before 'to'");
        }
        return ResponseEntity.ok(analyticsService.getTrends(metric, from, to));
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> comparePeriods(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period1From,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period1To,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period2From,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period2To) {
        return ResponseEntity.ok(analyticsService.comparePeriods(period1From, period1To, period2From, period2To));
    }

    @GetMapping("/ftp-progress")
    public ResponseEntity<FtpProgressDto> getFtpProgress(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(analyticsService.getFtpProgress(from, to));
    }

    @GetMapping("/readiness")
    public ResponseEntity<ReadinessDto> getReadiness() {
        return ResponseEntity.ok(analyticsService.getReadiness());
    }

    @GetMapping("/durability")
    public ResponseEntity<DurabilityInsightDto> getDurability() {
        return ResponseEntity.ok(analyticsService.getDurabilityInsights());
    }

    @GetMapping("/progression-levels")
    public ResponseEntity<List<ProgressionLevelDto>> getProgressionLevels() {
        return ResponseEntity.ok(analyticsService.getProgressionLevels());
    }

    @GetMapping("/block-health")
    public ResponseEntity<BlockHealthDto> getBlockHealth() {
        return ResponseEntity.ok(blockHealthService.getCurrentBlockHealth());
    }

    @PostMapping("/readiness/check-in")
    public ResponseEntity<ReadinessDto> saveReadinessCheckIn(
            @Validated @RequestBody SaveReadinessCheckInRequest request) {
        return ResponseEntity.ok(analyticsService.saveReadinessCheckIn(request));
    }

    @GetMapping("/weekly-optimal-load")
    public ResponseEntity<List<WeeklyOptimalLoadDto>> getWeeklyOptimalLoad(
            @RequestParam(defaultValue = "12") int weeks) {
        return ResponseEntity.ok(analyticsService.getWeeklyOptimalLoad(Math.min(Math.max(1, weeks), 156)));
    }

    @GetMapping("/daily-optimal-load")
    public ResponseEntity<List<DailyOptimalLoadDto>> getDailyOptimalLoad(
            @RequestParam(defaultValue = "60") int pastDays,
            @RequestParam(defaultValue = "21") int futureDays) {
        return ResponseEntity.ok(analyticsService.getDailyOptimalLoad(
                Math.min(Math.max(1, pastDays), 1095),
                Math.min(Math.max(0, futureDays), 90)));
    }

    @GetMapping("/training-status")
    public ResponseEntity<TrainingStatusDto> getTrainingStatus() {
        return ResponseEntity.ok(trainingStatusService.getTrainingStatus());
    }

    @GetMapping("/weekly-brief")
    public ResponseEntity<WeeklyBriefDto> getWeeklyBrief() {
        return ResponseEntity.ok(trainingStatusService.getWeeklyBrief());
    }
}
