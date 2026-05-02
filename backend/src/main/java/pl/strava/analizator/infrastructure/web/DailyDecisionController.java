package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.DailyDecisionService;
import pl.strava.analizator.application.dto.DailyDecisionDto;

@RestController
@RequestMapping("/api/daily-decision")
@RequiredArgsConstructor
public class DailyDecisionController {

    private final DailyDecisionService dailyDecisionService;

    @GetMapping
    public ResponseEntity<DailyDecisionDto> getDailyDecision() {
        return ResponseEntity.ok(dailyDecisionService.getDailyDecision());
    }
}
