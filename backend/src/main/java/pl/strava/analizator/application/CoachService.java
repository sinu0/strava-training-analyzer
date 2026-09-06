package pl.strava.analizator.application;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AdaptiveCoachRequest;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.DailyDecisionDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.AlternativeOptionDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.ConfidenceScoreDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.DecisionReasonDto;
import pl.strava.analizator.application.dto.DailyDecisionDto.WorkoutSuggestionDto;
import pl.strava.analizator.domain.coach.model.PostSessionFeedback;

/**
 * Unified coach facade that replaces {@link DailyDecisionService} and wraps {@link AdaptiveCoachService}.
 * Provides a single entry point for all coaching decisions.
 */
@Service
@RequiredArgsConstructor
public class CoachService {

    private final AdaptiveCoachService adaptiveCoachService;

    public AdaptiveCoachResponse getTodayDecision() {
        AdaptiveCoachRequest request = AdaptiveCoachRequest.builder()
                .build();
        AdaptiveCoachResponse response = adaptiveCoachService.decideWithRealData(request);
        return response;
    }

    public AdaptiveCoachResponse decide(AdaptiveCoachRequest request) {
        return adaptiveCoachService.decideWithRealData(request);
    }

    public void processFeedback(PostSessionFeedback feedback) {
        adaptiveCoachService.processFeedback(feedback);
    }

    /**
     * Returns a backward-compatible DailyDecisionDto generated from the
     * full AdaptiveCoachResponse. Used by legacy /api/daily-decision endpoint
     * until the frontend is fully migrated.
     */
    public DailyDecisionDto getDailyDecisionCompat() {
        AdaptiveCoachResponse coachResponse = getTodayDecision();

        String mappedDecision = mapDecision(coachResponse.getDecision());
        WorkoutSuggestionDto workout = mapWorkout(coachResponse.getBestSession());
        ConfidenceScoreDto confidence = ConfidenceScoreDto.builder()
                .score("LOW".equals(coachResponse.getConfidence()) ? 0.3 : 0.6).label(coachResponse.getConfidence()).description(coachResponse.getInsight())
                .build();
        String risk = coachResponse.getRisk() != null ? coachResponse.getRisk().getLevel() : "UNKNOWN";

        java.util.List<DecisionReasonDto> reasons = coachResponse.getReasoning() != null
                ? coachResponse.getReasoning().stream()
                        .map(r -> DecisionReasonDto.builder()
                                .priority("COACH").signal("")
                                .message(r).evidence("").build())
                        .toList()
                : java.util.List.of();

        java.util.List<AlternativeOptionDto> alternatives = coachResponse.getAlternatives() != null
                ? coachResponse.getAlternatives().stream()
                        .map(a -> AlternativeOptionDto.builder()
                                .label(a.getType())
                                .type("MODIFY")
                                .workout(mapWorkout(a))
                                .rationale("Score: " + a.getScore())
                                .build())
                        .toList()
                : java.util.List.of();

        return DailyDecisionDto.builder()
                .decision(mappedDecision)
                .workout(workout)
                .confidence(confidence)
                .risk(risk)
                .reasons(reasons)
                .alternatives(alternatives)
                .build();
    }

    private String mapDecision(String coachDecision) {
        if (coachDecision == null) return "NEEDS_INPUT";
        return switch (coachDecision.toUpperCase()) {
            case "TRAIN" -> "RIDE";
            case "ACTIVE_RECOVERY" -> "MODIFY";
            case "RECOVER", "REST" -> "SKIP";
            default -> "NEEDS_INPUT";
        };
    }

    private WorkoutSuggestionDto mapWorkout(pl.strava.analizator.application.dto.AdaptiveCoachResponse.SessionOptionDto session) {
        if (session == null) return null;
        return WorkoutSuggestionDto.builder()
                .type(session.getType())
                .durationMin(session.getDurationMinutes())
                .targetTss(session.getTargetTss() != null ? (int) Math.round(session.getTargetTss()) : null)
                .difficulty(session.getDifficulty())
                .intensityDescription(session.getDescription())
                .description(session.getDescription())
                .indoor(session.isIndoor())
                .build();
    }

}
