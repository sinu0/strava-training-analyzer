package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.CoachService;
import pl.strava.analizator.application.dto.AdaptiveCoachRequest;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.PostSessionFeedbackRequest;
import pl.strava.analizator.domain.coach.model.PostSessionFeedback;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachService coachService;

    @GetMapping("/today")
    public ResponseEntity<AdaptiveCoachResponse> getTodayDecision() {
        return ResponseEntity.ok(coachService.getTodayDecision());
    }

    @PostMapping("/decide")
    public ResponseEntity<AdaptiveCoachResponse> decide(@RequestBody AdaptiveCoachRequest request) {
        return ResponseEntity.ok(coachService.decide(request));
    }

    @PostMapping("/feedback")
    public ResponseEntity<Void> feedback(@RequestBody PostSessionFeedbackRequest request) {
        PostSessionFeedback feedback = PostSessionFeedback.builder()
                .rpe(request.getRpe())
                .subjectiveFeedback(request.getSubjectiveFeedback())
                .executionQuality(request.getExecutionQuality())
                .completed(request.isCompleted())
                .actualTss(request.getActualTss())
                .actualDurationMinutes(request.getActualDurationMinutes())
                .plannedType(request.getPlannedType())
                .build();
        coachService.processFeedback(feedback);
        return ResponseEntity.ok().build();
    }
}
