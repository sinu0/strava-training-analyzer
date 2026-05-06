package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdaptiveCoachResponse {

    private String decision;
    private SessionOptionDto bestSession;
    private List<SessionOptionDto> alternatives;
    private List<SessionOptionDto> allScoredSessions;
    private List<String> reasoning;
    private GoalProgressDto goalProgress;
    private FatigueDto fatigue;
    private RiskDto risk;
    private AccountabilityDto accountability;
    private ConsistencyDto consistency;
    private EfficiencyDto efficiency;
    private FatigueDebtDto fatigueDebt;
    private String insight;
    private String aiInterpretation;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionOptionDto {
        private String type;
        private int durationMinutes;
        private double targetTss;
        private double intensityFactor;
        private String difficulty;
        private String description;
        private boolean indoor;
        private double score;
        private Map<String, Double> scoreBreakdown;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoalProgressDto {
        private double currentValue;
        private double targetValue;
        private double gap;
        private double gapPercent;
        private double projectedDaysToTarget;
        private String phase;
        private double weeklyProgressRate;
        private String status;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FatigueDto {
        private double projectedAtl;
        private double projectedTsb;
        private double currentAtl;
        private double currentTsb;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskDto {
        private String level;
        private String primaryRisk;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountabilityDto {
        private String status;
        private double actualLoad;
        private double expectedLoad;
        private double gap;
        private String message;
        private String recommendedAction;
        private double timelineAdjustmentDays;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsistencyDto {
        private double completionRatio;
        private int completedSessions;
        private int expectedSessions;
        private double gainMultiplier;
        private String status;
        private String recommendation;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EfficiencyDto {
        private double completionRatio;
        private String rating;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FatigueDebtDto {
        private double debt;
        private String severity;
        private int recoveryDaysNeeded;
        private boolean requiresRecovery;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionScoreDto {
        private String type;
        private double score;
    }
}
