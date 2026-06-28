package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AdaptiveCoachRequest;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.AccountabilityDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.ConsistencyDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.EfficiencyDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.FatigueDebtDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.FatigueDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.GoalProgressDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.RiskDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse.SessionOptionDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.ReadinessHealthSignalsDto;
import pl.strava.analizator.domain.coach.engine.AccountabilityEngine;
import pl.strava.analizator.domain.coach.engine.AdaptiveScoringEngine;
import pl.strava.analizator.domain.coach.engine.AiInputInterpreter;
import pl.strava.analizator.domain.coach.engine.ConsistencyModel;
import pl.strava.analizator.domain.coach.engine.FatigueDebtEngine;
import pl.strava.analizator.domain.coach.engine.FeedbackLoop;
import pl.strava.analizator.domain.coach.engine.GoalEngine;
import pl.strava.analizator.domain.coach.model.AiInputModifiers;
import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.CoachDecisionType;
import pl.strava.analizator.domain.coach.model.ConsistencyReport;
import pl.strava.analizator.domain.coach.model.FatigueCost;
import pl.strava.analizator.domain.coach.model.Goal;
import pl.strava.analizator.domain.coach.model.GoalProgressSummary;
import pl.strava.analizator.domain.coach.model.GoalType;
import pl.strava.analizator.domain.coach.model.OverrideState;
import pl.strava.analizator.domain.coach.model.PostSessionFeedback;
import pl.strava.analizator.domain.coach.model.RiskPenalty;
import pl.strava.analizator.domain.coach.model.SessionOption;
import pl.strava.analizator.domain.coach.model.TrajectoryPhase;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.model.TrainingDayEnvironment;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.port.TrainingDayEnvironmentPort;

@Service
public class AdaptiveCoachService {

    private static final List<String> ALL_SESSION_TYPES = List.of(
            "RECOVERY", "ENDURANCE", "TEMPO", "SWEET_SPOT", "THRESHOLD", "VO2MAX", "ANAEROBIC");
    private static final int DEFAULT_BASE_DURATION = 90;
    private static final double DEFAULT_BASE_TSS = 70;

    private final DailyMetricRepository dailyMetricRepository;
    private final DailySummaryRepository dailySummaryRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final AnalyticsService analyticsService;
    private final TrainingDayEnvironmentPort trainingDayEnvironmentPort;

    private final GoalEngine goalEngine;
    private final AdaptiveScoringEngine scoringEngine;
    private final AiInputInterpreter aiInterpreter;
    private final ConsistencyModel consistencyModel;
    private final AccountabilityEngine accountabilityEngine;
    private final FatigueDebtEngine fatigueDebtEngine;
    private final FeedbackLoop feedbackLoop;

    public AdaptiveCoachService(DailyMetricRepository dailyMetricRepository,
                                 DailySummaryRepository dailySummaryRepository,
                                 AthleteProfileRepository athleteProfileRepository,
                                 AnalyticsService analyticsService,
                                 TrainingDayEnvironmentPort trainingDayEnvironmentPort) {
        this.dailyMetricRepository = dailyMetricRepository;
        this.dailySummaryRepository = dailySummaryRepository;
        this.athleteProfileRepository = athleteProfileRepository;
        this.analyticsService = analyticsService;
        this.trainingDayEnvironmentPort = trainingDayEnvironmentPort;
        this.goalEngine = new GoalEngine();
        this.scoringEngine = new AdaptiveScoringEngine();
        this.aiInterpreter = new AiInputInterpreter();
        this.consistencyModel = new ConsistencyModel();
        this.accountabilityEngine = new AccountabilityEngine();
        this.fatigueDebtEngine = new FatigueDebtEngine();
        this.feedbackLoop = new FeedbackLoop();
    }

    public AdaptiveCoachResponse decideWithRealData(AdaptiveCoachRequest request) {
        AthleteContext systemContext = buildSystemContext();
        AthleteContext mergedContext = mergeContext(systemContext, request);
        return decide(request, mergedContext);
    }

    private AdaptiveCoachResponse decide(AdaptiveCoachRequest request, AthleteContext context) {
        Goal goal = mapGoal(request);
        AiInputModifiers aiModifiers = aiInterpreter.interpret(request.getAiInput());
        OverrideState override = request.getOverrideState() != null
                ? OverrideState.valueOf(request.getOverrideState().toUpperCase()) : OverrideState.NONE;

        GoalProgressSummary progress = goalEngine.computeProgress(goal, 0.8);
        TrajectoryPhase phase = progress.getPhase();

        ConsistencyReport consistency = consistencyModel.evaluate(context);

        int baseDuration = context.getTimeAvailableMinutes() > 0
                ? context.getTimeAvailableMinutes() : DEFAULT_BASE_DURATION;
        double baseTss = DEFAULT_BASE_TSS;

        List<SessionOption> scored = scoringEngine.scoreSessions(
                ALL_SESSION_TYPES, baseDuration, baseTss,
                goal, phase, context, override, aiModifiers, consistency);

        SessionOption best = scored.get(0);

        List<SessionOption> alternatives = new ArrayList<>();
        alternatives.addAll(scored.subList(1, Math.min(4, scored.size())));

        for (String altType : List.of("RECOVERY", "ENDURANCE")) {
            boolean already = scored.stream().anyMatch(o -> o.getType().equalsIgnoreCase(altType));
            if (!already) {
                List<SessionOption> altScored = scoringEngine.scoreSessions(
                        List.of(altType), baseDuration, baseTss,
                        goal, phase, context, override, aiModifiers, consistency);
                if (!altScored.isEmpty()) {
                    alternatives.add(altScored.get(0));
                }
            }
        }

        double expectedLoad = computeExpectedLoad(context);
        double actualLoad = context.getAtl();

        CoachDecisionType decision = determineCoachDecision(best, context);

        FatigueCost fatigueCost = new FatigueCost(0, 1.0, 1.0, context.getAtl(), context.getTsb());
        RiskPenalty riskPenalty = new RiskPenalty(0, "LOW", 0, 0, "none");

        var accountability = accountabilityEngine.evaluate(actualLoad, expectedLoad, context);

        double baselineAtl = fatigueDebtEngine.computeBaselineAtl(context.getCtl());
        var fatigueDebt = fatigueDebtEngine.compute(context, baselineAtl);

        List<String> reasoning = buildReasoning(best, scored, goal, phase, consistency, aiModifiers, override);

        String insight = buildInsight(goal, progress, consistency, accountability, fatigueDebt);

        return AdaptiveCoachResponse.builder()
                .decision(decision.name())
                .bestSession(toSessionDto(best))
                .alternatives(alternatives.stream().map(this::toSessionDto).toList())
                .allScoredSessions(scored.stream().map(this::toSessionDto).toList())
                .reasoning(reasoning)
                .goalProgress(toGoalProgressDto(progress))
                .fatigue(FatigueDto.builder()
                        .projectedAtl(fatigueCost.getProjectedAtl())
                        .projectedTsb(fatigueCost.getProjectedTsb())
                        .currentAtl(context.getAtl())
                        .currentTsb(context.getTsb())
                        .build())
                .risk(RiskDto.builder()
                        .level(riskPenalty.getRiskLevel())
                        .primaryRisk(riskPenalty.getPrimaryRisk())
                        .build())
                .accountability(toAccountabilityDto(accountability))
                .consistency(toConsistencyDto(consistency))
                .efficiency(EfficiencyDto.builder()
                        .completionRatio(consistency.getCompletionRatio())
                        .rating(consistency.getStatus())
                        .build())
                .fatigueDebt(FatigueDebtDto.builder()
                        .debt(fatigueDebt.getDebt())
                        .severity(fatigueDebt.getSeverity())
                        .recoveryDaysNeeded(fatigueDebt.getRecoveryDaysNeeded())
                        .requiresRecovery(fatigueDebt.isRequiresRecovery())
                        .build())
                .insight(insight)
                .aiInterpretation(aiModifiers.getInterpretedIntent())
                .build();
    }

    public void processFeedback(PostSessionFeedback feedback) {
        feedbackLoop.process(feedback);
    }

    private AthleteContext buildSystemContext() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        ReadinessDto readiness = analyticsService.getReadiness();
        double ctl = readiness.getCtl();
        double atl = readiness.getAtl();
        double tsb = readiness.getTsb();
        double readinessScore = readiness.getScore();

        double monotony = dailyMetricRepository.findNumericValue(today, "training_monotony")
                .or(() -> dailyMetricRepository.findNumericValue(yesterday, "training_monotony"))
                .map(BigDecimal::doubleValue).orElse(1.2);

        DailySummary summary = dailySummaryRepository.findByDate(today)
                .or(() -> dailySummaryRepository.findByDate(yesterday))
                .orElse(null);

        ReadinessHealthSignalsDto healthSignals = readiness.getHealthSignals();
        double sleep = healthSignals != null && healthSignals.getSleepScore() != null
                ? healthSignals.getSleepScore().doubleValue() : 75;
        double bodyBattery = healthSignals != null && healthSignals.getBodyBattery() != null
                ? healthSignals.getBodyBattery().doubleValue() : 70;
        double stress = summary != null && summary.getStressAvg() != null
                ? summary.getStressAvg().doubleValue() : 30;
        double hrv = summary != null && summary.getHrvRmssd() != null
                ? summary.getHrvRmssd().doubleValue() : 0;

        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        double restingHr = profile != null && profile.getRestingHrBpm() != null
                ? profile.getRestingHrBpm().doubleValue() : 55;
        double baselineHrv = 50;
        double baselineRestingHr = restingHr > 0 ? restingHr : 52;

        java.util.Optional<TrainingDayEnvironment> env = trainingDayEnvironmentPort.getEnvironmentFor(today);
        int weatherScore = env.map(TrainingDayEnvironment::getOutdoorScore).orElse(80);
        String weatherDesc = env.map(TrainingDayEnvironment::getWeatherDescription).orElse("");

        Map<String, Double> metrics = new HashMap<>();
        double ftp = profile != null && profile.getFtpWatts() != null
                ? profile.getFtpWatts().doubleValue() : 250;
        metrics.put("ftp", ftp);
        metrics.put("weight_kg", profile != null && profile.getWeightKg() != null
                ? profile.getWeightKg().doubleValue() : 72);

        return AthleteContext.builder()
                .ctl(ctl).atl(atl).tsb(tsb)
                .trainingMonotony(monotony)
                .readinessScore(readinessScore)
                .hrvRmssd(hrv).baselineHrv(baselineHrv)
                .restingHr(restingHr).baselineRestingHr(baselineRestingHr)
                .sleepScore(sleep).bodyBattery(bodyBattery).stressAvg(stress)
                .timeAvailableMinutes(90)
                .weatherScore(weatherScore).weatherDescription(weatherDesc)
                .recentSessionOutcomes(List.of())
                .metricValues(metrics)
                .hasHrvData(hrv > 0)
                .hasWeatherData(env.isPresent())
                .hasRecentActivities(true)
                .completedRecentSessions(5)
                .expectedRecentSessions(6)
                .build();
    }

    private AthleteContext mergeContext(AthleteContext system, AdaptiveCoachRequest request) {
        return AthleteContext.builder()
                .ctl(request.getCtl() != null ? request.getCtl() : system.getCtl())
                .atl(request.getAtl() != null ? request.getAtl() : system.getAtl())
                .tsb(request.getTsb() != null ? request.getTsb() : system.getTsb())
                .trainingMonotony(request.getTrainingMonotony() != null
                        ? request.getTrainingMonotony() : system.getTrainingMonotony())
                .readinessScore(request.getReadinessScore() != null
                        ? request.getReadinessScore() : system.getReadinessScore())
                .hrvRmssd(request.getHrvRmssd() != null ? request.getHrvRmssd() : system.getHrvRmssd())
                .baselineHrv(request.getBaselineHrv() != null ? request.getBaselineHrv() : system.getBaselineHrv())
                .restingHr(request.getRestingHr() != null ? request.getRestingHr() : system.getRestingHr())
                .baselineRestingHr(request.getBaselineRestingHr() != null
                        ? request.getBaselineRestingHr() : system.getBaselineRestingHr())
                .sleepScore(request.getSleepScore() != null ? request.getSleepScore() : system.getSleepScore())
                .bodyBattery(request.getBodyBattery() != null ? request.getBodyBattery() : system.getBodyBattery())
                .stressAvg(request.getStressAvg() != null ? request.getStressAvg() : system.getStressAvg())
                .timeAvailableMinutes(request.getTimeAvailableMinutes() != null
                        ? request.getTimeAvailableMinutes() : system.getTimeAvailableMinutes())
                .weatherScore(request.getWeatherScore() != null
                        ? request.getWeatherScore() : system.getWeatherScore())
                .weatherDescription(request.getWeatherDescription() != null
                        ? request.getWeatherDescription() : system.getWeatherDescription())
                .recentSessionOutcomes(request.getRecentSessionOutcomes() != null
                        ? request.getRecentSessionOutcomes() : system.getRecentSessionOutcomes())
                .metricValues(system.getMetricValues())
                .hasHrvData(request.getHasHrvData() != null ? request.getHasHrvData() : system.isHasHrvData())
                .hasWeatherData(request.getHasWeatherData() != null
                        ? request.getHasWeatherData() : system.isHasWeatherData())
                .hasRecentActivities(request.getHasRecentActivities() != null
                        ? request.getHasRecentActivities() : system.isHasRecentActivities())
                .completedRecentSessions(request.getCompletedRecentSessions() != null
                        ? request.getCompletedRecentSessions() : system.getCompletedRecentSessions())
                .expectedRecentSessions(request.getExpectedRecentSessions() != null
                        ? request.getExpectedRecentSessions() : system.getExpectedRecentSessions())
                .build();
    }

    private Goal mapGoal(AdaptiveCoachRequest request) {
        GoalType type = request.getGoalType() != null
                ? GoalType.valueOf(request.getGoalType().toUpperCase()) : GoalType.FTP;
        double target = request.getTargetValue() != null ? request.getTargetValue() : 300;
        double current = request.getCurrentValue() != null ? request.getCurrentValue() : 250;

        if (type == GoalType.FTP && request.getCurrentValue() == null) {
            double ftp = athleteProfileRepository.findFirst()
                    .map(p -> p.getFtpWatts() != null ? p.getFtpWatts().doubleValue() : 250.0)
                    .orElse(250.0);
            current = ftp;
            target = Math.max(target, ftp + 10);
        }

        return Goal.builder()
                .goalType(type)
                .targetMetric(request.getTargetMetric())
                .targetValue(target)
                .currentValue(current)
                .context(request.getGoalContext())
                .deadline(request.getDeadline())
                .progressPerWeek(request.getProgressPerWeek())
                .isPrimary(true)
                .build();
    }

    private CoachDecisionType determineCoachDecision(SessionOption best, AthleteContext context) {
        if (best.getScore() < 0.1) return CoachDecisionType.REST;
        if ("RECOVERY".equalsIgnoreCase(best.getType())) return CoachDecisionType.ACTIVE_RECOVERY;
        if (context.getReadinessScore() < 30) return CoachDecisionType.RECOVER;
        return CoachDecisionType.TRAIN;
    }

    private List<String> buildReasoning(SessionOption best, List<SessionOption> all,
                                         Goal goal, TrajectoryPhase phase,
                                         ConsistencyReport consistency,
                                         AiInputModifiers ai, OverrideState override) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Goal: " + goal.getGoalType() + " (target: " + goal.getTargetValue()
                + ", current: " + String.format("%.0f", goal.getCurrentValue()) + ")");
        reasons.add("Phase: " + phase.name());
        reasons.add("Best session: " + best.getType() + " (score: " + String.format("%.2f", best.getScore()) + ")");

        if (best.getScoreBreakdown() != null) {
            reasons.add("Score breakdown: goal_gain="
                    + String.format("%.2f", best.getScoreBreakdown().get("goal_gain"))
                    + " fatigue_cost="
                    + String.format("%.2f", best.getScoreBreakdown().get("fatigue_cost"))
                    + " risk_penalty="
                    + String.format("%.2f", best.getScoreBreakdown().get("risk_penalty"))
                    + " consistency="
                    + String.format("%.2f", best.getScoreBreakdown().get("consistency_multiplier")));
        }

        reasons.add("Consistency: " + consistency.getStatus()
                + " (" + String.format("%.0f%%", consistency.getCompletionRatio() * 100) + ")");

        if (ai != null && ai.getInterpretedIntent() != null && !"NO_INPUT".equals(ai.getInterpretedIntent())) {
            reasons.add("AI input: " + ai.getInterpretedIntent());
        }

        if (override != null && override != OverrideState.NONE) {
            reasons.add("Override: " + override.name());
        }

        reasons.add("Top alternatives: " + String.join(", ",
                all.subList(1, Math.min(4, all.size())).stream()
                        .map(s -> s.getType() + " (" + String.format("%.2f", s.getScore()) + ")")
                        .toList()));

        return reasons;
    }

    private String buildInsight(Goal goal, GoalProgressSummary progress,
                                 ConsistencyReport consistency,
                                 pl.strava.analizator.domain.coach.model.AccountabilityReport accountability,
                                 pl.strava.analizator.domain.coach.model.FatigueDebt debt) {
        StringBuilder sb = new StringBuilder();
        sb.append(progress.getStatus().equals("ON_TRACK")
                ? "You're on track toward " + goal.getGoalType() + ". "
                : "Adjust training to reach " + goal.getGoalType() + ". ");
        sb.append("Phase: ").append(progress.getPhase().name()).append(". ");
        sb.append("Consistency: ").append(consistency.getStatus()).append(". ");
        sb.append(accountability.getMessage());

        if (debt.isRequiresRecovery()) {
            sb.append(" Fatigue debt: ").append(debt.getSeverity())
                    .append(" — ").append(debt.getRecoveryDaysNeeded())
                    .append(" recovery day(s) recommended.");
        }
        return sb.toString();
    }

    private SessionOptionDto toSessionDto(SessionOption opt) {
        return SessionOptionDto.builder()
                .type(opt.getType()).durationMinutes(opt.getDurationMinutes())
                .targetTss(opt.getTargetTss()).intensityFactor(opt.getIntensityFactor())
                .difficulty(opt.getDifficulty()).description(opt.getDescription())
                .indoor(opt.isIndoor())
                .score(opt.getScore() > 0 ? Math.round(opt.getScore() * 100.0) / 100.0 : 0)
                .scoreBreakdown(opt.getScoreBreakdown())
                .build();
    }

    private GoalProgressDto toGoalProgressDto(GoalProgressSummary progress) {
        return GoalProgressDto.builder()
                .currentValue(progress.getCurrentValue()).targetValue(progress.getTargetValue())
                .gap(progress.getGap())
                .gapPercent(Math.round(progress.getGapPercent() * 10.0) / 10.0)
                .projectedDaysToTarget(progress.getProjectedDaysToTarget())
                .phase(progress.getPhase().name())
                .weeklyProgressRate(progress.getWeeklyProgressRate())
                .status(progress.getStatus())
                .build();
    }

    private AccountabilityDto toAccountabilityDto(
            pl.strava.analizator.domain.coach.model.AccountabilityReport report) {
        return AccountabilityDto.builder()
                .status(report.getStatus().name()).actualLoad(report.getActualLoad())
                .expectedLoad(report.getExpectedLoad()).gap(report.getGap())
                .message(report.getMessage()).recommendedAction(report.getRecommendedAction())
                .timelineAdjustmentDays(report.getTimelineAdjustmentDays())
                .build();
    }

    private ConsistencyDto toConsistencyDto(ConsistencyReport report) {
        return ConsistencyDto.builder()
                .completionRatio(Math.round(report.getCompletionRatio() * 100.0) / 100.0)
                .completedSessions(report.getCompletedSessions())
                .expectedSessions(report.getExpectedSessions())
                .gainMultiplier(Math.round(report.getGainMultiplier() * 100.0) / 100.0)
                .status(report.getStatus()).recommendation(report.getRecommendation())
                .build();
    }

    private double computeExpectedLoad(AthleteContext context) {
        return Math.max(30, context.getCtl() * 0.9);
    }
}
