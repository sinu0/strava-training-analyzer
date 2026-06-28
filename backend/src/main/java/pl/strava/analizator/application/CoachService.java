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
                .goalType("FTP")
                .timeAvailableMinutes(90)
                .build();
        AdaptiveCoachResponse response = adaptiveCoachService.decideWithRealData(request);
        enrichWorkoutDescriptions(response);
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
                .score(0.7).label("MEDIUM").description("Auto-generated from Coach Engine")
                .build();
        String risk = coachResponse.getRisk() != null ? coachResponse.getRisk().getLevel() : "LOW";

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
        if (coachDecision == null) return "RIDE";
        return switch (coachDecision.toUpperCase()) {
            case "TRAIN" -> "RIDE";
            case "ACTIVE_RECOVERY" -> "MODIFY";
            case "RECOVER", "REST" -> "SKIP";
            default -> "RIDE";
        };
    }

    private WorkoutSuggestionDto mapWorkout(pl.strava.analizator.application.dto.AdaptiveCoachResponse.SessionOptionDto session) {
        if (session == null) return null;
        return WorkoutSuggestionDto.builder()
                .type(session.getType())
                .durationMin(session.getDurationMinutes())
                .targetTss((int) Math.round(session.getTargetTss()))
                .difficulty(session.getDifficulty())
                .intensityDescription(session.getDescription())
                .description(session.getDescription())
                .indoor(session.isIndoor())
                .build();
    }

    private void enrichWorkoutDescriptions(AdaptiveCoachResponse response) {
        if (response.getBestSession() != null) {
            response.getBestSession().setDescription(
                    buildWorkoutStructure(response.getBestSession()));
        }
        if (response.getAllScoredSessions() != null) {
            response.getAllScoredSessions().forEach(s ->
                    s.setDescription(buildWorkoutStructure(s)));
        }
        if (response.getAlternatives() != null) {
            response.getAlternatives().forEach(s ->
                    s.setDescription(buildWorkoutStructure(s)));
        }
    }

    private String buildWorkoutStructure(AdaptiveCoachResponse.SessionOptionDto session) {
        int totalMin = session.getDurationMinutes();
        String type = session.getType() != null ? session.getType().toUpperCase() : "ENDURANCE";

        return switch (type) {
            case "RECOVERY" -> String.format(
                    "%d min bardzo lekkiej jazdy Z1 (<55%% FTP). Równomierne, niskie tempo — regeneracja aktywna.", totalMin);
            case "ENDURANCE" -> {
                int warmup = Math.max(10, totalMin / 6);
                int main = totalMin - warmup * 2;
                yield String.format(
                        "%d min warmup Z1-Z2 → %d min Z2 (65-75%% FTP, równomiernie) → %d min cooldown Z1. Cel: budowa bazy tlenowej.",
                        warmup, main, warmup);
            }
            case "TEMPO" -> {
                int warmup = Math.max(10, totalMin / 6);
                int cooldown = Math.max(10, totalMin / 8);
                int main = totalMin - warmup - cooldown;
                yield String.format(
                        "%d min warmup Z1-Z2 → %d min Z3 (76-90%% FTP, tempo) → %d min cooldown Z1. Cel: ekonomia wysiłku.",
                        warmup, main, cooldown);
            }
            case "SWEET_SPOT" -> {
                int warmup = 12;
                int cooldown = 10;
                int remaining = totalMin - warmup - cooldown;
                int blocks = Math.max(2, remaining / 25);
                int blockDuration = remaining / blocks - 3;
                yield String.format(
                        "%d min warmup → %d×%d min SS (88-94%% FTP) z %d min Z1 przerwy → %d min cooldown. Cel: próg mleczanowy.",
                        warmup, blocks, blockDuration, 3, cooldown);
            }
            case "THRESHOLD" -> {
                int warmup = 15;
                int cooldown = 12;
                int remaining = totalMin - warmup - cooldown;
                int intervals = Math.max(2, remaining / 18);
                int intervalDur = remaining / intervals - 5;
                yield String.format(
                        "%d min warmup Z1-Z2 → %d×%d min Z4 (95-105%% FTP) z %d min Z1 przerwy → %d min cooldown Z1. Cel: FTP + próg.",
                        warmup, intervals, intervalDur, 5, cooldown);
            }
            case "VO2MAX" -> {
                int warmup = 15;
                int cooldown = 12;
                int remaining = totalMin - warmup - cooldown;
                int intervals = Math.max(3, remaining / 10);
                int intervalDur = Math.min(5, remaining / intervals - 3);
                yield String.format(
                        "%d min warmup Z1-Z2 → %d×%d min Z5 (106-120%% FTP) z %d min Z1 przerwy → %d min cooldown. Cel: VO2max.",
                        warmup, intervals, intervalDur, 3, cooldown);
            }
            case "ANAEROBIC" -> {
                int warmup = 15;
                int cooldown = 15;
                int remaining = totalMin - warmup - cooldown;
                int sprints = Math.max(4, remaining / 6);
                yield String.format(
                        "%d min warmup Z1-Z3 + otwarcia → %d×30-60s sprint (>150%% FTP) z %d min Z1 przerwy → %d min cooldown Z1. Cel: moc beztlenowa.",
                        warmup, sprints, 3, cooldown);
            }
            default -> String.format(
                    "%d min jazdy (%s). Dostosuj intensywność do samopoczucia.", totalMin, type);
        };
    }
}
