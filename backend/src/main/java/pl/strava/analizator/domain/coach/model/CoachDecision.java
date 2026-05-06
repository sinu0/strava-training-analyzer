package pl.strava.analizator.domain.coach.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CoachDecision {
    private final CoachDecisionType decision;
    private final SessionOption bestSession;
    private final List<SessionOption> alternatives;
    private final List<String> reasoning;
    private final GoalProgressSummary goalProgress;
    private final FatigueCost fatigueCost;
    private final RiskPenalty riskPenalty;
    private final AccountabilityReport accountability;
    private final ConsistencyReport consistency;
    private final TrainingEfficiency efficiency;
    private final FatigueDebt fatigueDebt;
    private final String insight;
}
