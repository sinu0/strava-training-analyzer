package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AdaptiveCoachService;
import pl.strava.analizator.application.dto.AdaptiveCoachRequest;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.PostSessionFeedbackRequest;
import pl.strava.analizator.domain.coach.model.PostSessionFeedback;

@RestController
@RequestMapping("/api/adaptive-coach")
@RequiredArgsConstructor
public class AdaptiveCoachController {

    private final AdaptiveCoachService coachService;

    @GetMapping("/today")
    public ResponseEntity<AdaptiveCoachResponse> today(
            @RequestParam(required = false) String goalType,
            @RequestParam(required = false) Double targetValue,
            @RequestParam(required = false) Double currentValue,
            @RequestParam(required = false) String aiInput,
            @RequestParam(required = false) String overrideState,
            @RequestParam(required = false) Integer timeAvailableMinutes) {

        AdaptiveCoachRequest request = AdaptiveCoachRequest.builder()
                .goalType(goalType != null ? goalType : "FTP")
                .targetValue(targetValue)
                .currentValue(currentValue)
                .aiInput(aiInput)
                .overrideState(overrideState)
                .timeAvailableMinutes(timeAvailableMinutes)
                .build();

        AdaptiveCoachResponse response = coachService.decideWithRealData(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/decide")
    public ResponseEntity<AdaptiveCoachResponse> decide(@RequestBody AdaptiveCoachRequest request) {
        AdaptiveCoachResponse response = coachService.decideWithRealData(request);
        return ResponseEntity.ok(response);
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
