package pl.strava.analizator.domain.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DailyDecision {
    private final DecisionType decision;
    private final WorkoutSuggestion workout;
    private final ConfidenceScore confidence;
    private final RiskLevel risk;
    private final List<DecisionReason> reasons;
    private final List<AlternativeOption> alternatives;
}
