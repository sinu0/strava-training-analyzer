package pl.strava.analizator.infrastructure.web;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.StreakService;

@RestController
@RequestMapping("/api/streak")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;

    @GetMapping("/calendar")
    public ResponseEntity<Map<String, Object>> getCalendar(@RequestParam(defaultValue = "2026") int year) {
        return ResponseEntity.ok(streakService.getActivityCalendar(year));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(streakService.getStreakStats());
    }
}
