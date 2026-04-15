package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.WeightService;
import pl.strava.analizator.application.dto.AddWeightRequest;
import pl.strava.analizator.application.dto.SetWeightGoalRequest;
import pl.strava.analizator.application.dto.WeightGoalDto;
import pl.strava.analizator.application.dto.WeightOverviewDto;
import pl.strava.analizator.application.dto.WeightRecordDto;

@RestController
@RequestMapping("/api/weight")
@RequiredArgsConstructor
public class WeightController {

    private final WeightService weightService;

    @GetMapping
    public ResponseEntity<WeightOverviewDto> getOverview() {
        return ResponseEntity.ok(weightService.getOverview());
    }

    @GetMapping("/history")
    public ResponseEntity<List<WeightRecordDto>> getHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(weightService.getHistory(from, to));
    }

    @PostMapping
    public ResponseEntity<WeightRecordDto> addWeight(
            @Validated @RequestBody AddWeightRequest request) {
        return ResponseEntity.ok(weightService.addWeight(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWeight(@PathVariable UUID id) {
        weightService.deleteWeight(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/goal")
    public ResponseEntity<WeightGoalDto> setGoal(
            @Validated @RequestBody SetWeightGoalRequest request) {
        return ResponseEntity.ok(weightService.setGoal(request));
    }

    @DeleteMapping("/goal/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable UUID id) {
        weightService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}
