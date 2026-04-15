package pl.strava.analizator.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.GamificationService;
import pl.strava.analizator.application.dto.AchievementDto;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementDto>> getAchievements() {
        return ResponseEntity.ok(gamificationService.getAchievements());
    }

    @PostMapping("/achievements/evaluate")
    public ResponseEntity<List<AchievementDto>> evaluateAchievements() {
        return ResponseEntity.ok(gamificationService.evaluateAll());
    }
}
