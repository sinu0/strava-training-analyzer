package pl.strava.analizator.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.NudgeService;
import pl.strava.analizator.application.dto.NudgeDto;

@RestController
@RequestMapping("/api/nudges")
@RequiredArgsConstructor
public class NudgeController {

    private final NudgeService nudgeService;

    @GetMapping
    public ResponseEntity<List<NudgeDto>> getPendingNudges() {
        return ResponseEntity.ok(nudgeService.getPendingNudges());
    }
}
