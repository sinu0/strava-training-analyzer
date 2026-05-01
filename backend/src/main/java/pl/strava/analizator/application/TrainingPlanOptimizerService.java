package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.ApplyOptimizedPlanRequest;
import pl.strava.analizator.application.dto.OptimizePlanRequest;
import pl.strava.analizator.application.dto.OptimizePlanResponse;
import pl.strava.analizator.application.dto.OptimizePlanResponse.IntensityDistributionDto;
import pl.strava.analizator.application.dto.OptimizePlanResponse.OptimizedSessionDto;
import pl.strava.analizator.application.dto.OptimizePlanResponse.PlanResultDto;
import pl.strava.analizator.application.dto.OptimizePlanResponse.PlanStrategyDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.domain.model.GoalPriority;
import pl.strava.analizator.domain.model.ProgramGoal;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanProgram;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.TrainingPlanProgramRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;

@Service
@RequiredArgsConstructor
public class TrainingPlanOptimizerService {

    private static final double TAU_FITNESS = 42.0;
    private static final double TAU_FATIGUE = 7.0;
    private static final double CTL_RAMP_MAX = 8.0;
    private static final int MAX_HIGH_INTENSITY_PER_WEEK = 3;
    private static final int MONTE_CARLO_ITERATIONS = 30;
    private static final double TSS_VARIATION = 0.10;

    private final TrainingPlanRepository trainingPlanRepository;
    private final TrainingPlanProgramRepository programRepository;
    private final AthleteProfileRepository athleteProfileRepository;

    private final Random rng = new Random(42);

    public OptimizePlanResponse optimize(OptimizePlanRequest request) {
        int weeks = Math.max(1, request.getWeeks());
        int daysPerWeek = Math.max(3, Math.min(7, request.getTrainingDaysPerWeek()));
        double weeklyTss = request.getTargetWeeklyTss() != null
                ? request.getTargetWeeklyTss().doubleValue() : 400;
        double ctl = request.getCurrentCtl() != null
                ? request.getCurrentCtl().doubleValue() : 50;
        double atl = request.getCurrentAtl() != null
                ? request.getCurrentAtl().doubleValue() : 45;
        int ftp = request.getFtp() > 0 ? request.getFtp() : 250;
        LocalDate startDate = LocalDate.now().plusDays(1);

        int daysToPeak = request.getEventDate() != null
                ? (int) LocalDate.now().until(request.getEventDate()).getDays()
                : 99;

        String focus = daysToPeak < 14 ? "TAPER" : daysToPeak > 21 ? "BUILD" : "MAINTAIN";

        List<String> violations = new ArrayList<>();

        List<PlanResultDto> allPlans = new ArrayList<>();
        double[] multipliers = {0.75, 1.00, 1.20};
        String[] types = {"CONSERVATIVE", "BALANCED", "AGGRESSIVE"};

        for (int i = 0; i < 3; i++) {
            List<SessionPlan> plan = generatePlan(weeks, daysPerWeek, weeklyTss * multipliers[i],
                    ctl, atl, startDate, focus, daysToPeak, ftp);
            double score = scorePlan(plan, ctl, atl, violations);
            var scoreBreakdown = buildPlanScore(types[i], score, plan);

            List<OptimizedSessionDto> sessions = plan.stream().map(this::toSessionDto).toList();
            double totalTss = plan.stream().mapToDouble(SessionPlan::tss).sum();
            long lowCount = plan.stream().filter(s -> "LOW".equals(intensity(s.type()))).count();
            long highCount = plan.stream().filter(s -> "HIGH".equals(intensity(s.type()))).count();
            long total = plan.size();

            allPlans.add(PlanResultDto.builder()
                    .type(types[i])
                    .score(scoreBreakdown.getScore())
                    .adaptationGain(scoreBreakdown.getAdaptationGain())
                    .fatigueCost(scoreBreakdown.getFatigueCost())
                    .estimatedTss(BigDecimal.valueOf(Math.round(totalTss)))
                    .intensityDistribution(IntensityDistributionDto.builder()
                            .low(total > 0 ? Math.round(lowCount * 100.0 / total) : 0)
                            .moderate(total > 0 ? Math.round((total - lowCount - highCount) * 100.0 / total) : 0)
                            .high(total > 0 ? Math.round(highCount * 100.0 / total) : 0)
                            .build())
                    .sessions(sessions)
                    .build());
        }

        return OptimizePlanResponse.builder()
                .plans(allPlans)
                .loadSummary(List.of(
                        "3 plany wygenerowane: Konserwatywny (75% TSS), Zrownowazony (100%), Agresywny (120%)",
                        "Kazdy plan zawiera " + (weeks * daysPerWeek) + " sesji na przestrzeni " + weeks + " tygodni"
                ))
                .constraintViolations(violations)
                .strategy(PlanStrategyDto.builder()
                        .focus(focus)
                        .reasoning(buildReasoning(focus, daysToPeak, null))
                        .build())
                .confidence(computeConfidence(request))
                .build();
    }

    // ---- PLAN GENERATION (CSP approach) ----

    private List<SessionPlan> generatePlan(int weeks, int daysPerWeek, double weeklyTss,
            double startCtl, double startAtl, LocalDate startDate, String focus, int daysToPeak, int ftp) {

        List<SessionPlan> plan = new ArrayList<>();
        int[] rawTrainingDays = pickTrainingDays(daysPerWeek);
        java.util.Arrays.sort(rawTrainingDays);

        int totalSessions = weeks * daysPerWeek;
        int maxHiSessions = (int) Math.ceil(totalSessions * 0.22);
        int hiPerWeek = Math.max(1, Math.min(MAX_HIGH_INTENSITY_PER_WEEK,
                (int) Math.ceil((double) maxHiSessions / weeks)));
        int hiPlaced = 0;

        for (int week = 0; week < weeks; week++) {
            double weekTss = weeklyTss;
            if (focus.equals("TAPER") && week >= weeks - 1) {
                weekTss *= 0.60;
            } else if (focus.equals("TAPER") && week >= weeks - 2) {
                weekTss *= 0.80;
            }

            int weekHiBudget = Math.min(hiPerWeek, maxHiSessions - hiPlaced);
            double dayTss = weekTss / daysPerWeek;

            for (int dayOffset : rawTrainingDays) {
                LocalDate day = startDate.plusDays(week * 7L + dayOffset);
                String type;

                boolean prevDayWasHi = isPreviousTrainingDayHi(plan, day);

                if (weekHiBudget > 0 && !prevDayWasHi && dayTss >= 45 && hiPlaced < maxHiSessions) {
                    type = dayTss > 85 ? "VO2_MAX" : "THRESHOLD";
                    weekHiBudget--;
                    hiPlaced++;
                } else if (dayTss < 30) {
                    type = "RECOVERY";
                } else {
                    type = "ENDURANCE";
                }

                double tss = applyTaperFactor(dayTss, focus, daysToPeak, day);
                int duration = tssToDuration(tss, ftp);

                plan.add(new SessionPlan(day, type, duration, intensity(type), tss, goalForType(type)));
            }
        }

        return plan;
    }

    private int[] pickTrainingDays(int count) {
        int[] all = {0, 2, 3, 4, 5, 1, 6};
        int[] result = new int[count];
        System.arraycopy(all, 0, result, 0, Math.min(count, all.length));
        return result;
    }

    private int countHiSessions(List<SessionPlan> plan) {
        return (int) plan.stream().filter(s -> "HIGH".equals(s.intensity())).count();
    }

    private boolean isPreviousTrainingDayHi(List<SessionPlan> plan, LocalDate day) {
        return plan.stream()
                .filter(s -> s.day().equals(day.minusDays(1)))
                .anyMatch(s -> "HIGH".equals(s.intensity()));
    }

    private String intensity(String type) {
        if ("VO2_MAX".equals(type) || "THRESHOLD".equals(type)) return "HIGH";
        if ("ENDURANCE".equals(type)) return "LOW";
        return "LOW";
    }

    private String goalForType(String type) {
        return switch (type) {
            case "VO2_MAX" -> "Improve VO2max and anaerobic capacity with high-intensity intervals";
            case "THRESHOLD" -> "Raise lactate threshold through sustained moderate-hard efforts";
            case "RECOVERY" -> "Active recovery to promote adaptation and reduce fatigue";
            default -> "Build aerobic base and muscular endurance";
        };
    }

    private double applyTaperFactor(double tss, String focus, int daysToPeak, LocalDate day) {
        if (!"TAPER".equals(focus)) return tss;
        long daysUntil = LocalDate.now().until(day).getDays();
        long daysUntilPeak = daysToPeak - daysUntil;
        if (daysUntilPeak <= 3) return tss * 0.40;
        if (daysUntilPeak <= 7) return tss * 0.60;
        if (daysUntilPeak <= 10) return tss * 0.75;
        return tss;
    }

    // ---- SCORING (Banister fitness-fatigue) ----

    record SessionData(double tss, int dayOffset) {}

    private SessionData toSessionData(SessionPlan sp) {
        return new SessionData(sp.tss, (int) (LocalDate.now().plusDays(1).until(sp.day).getDays()));
    }

    private SessionData toSessionData(OptimizedSessionDto s) {
        double tss = s.getTss() != null ? s.getTss().doubleValue() : 50;
        int offset = (int) (LocalDate.now().plusDays(1).until(s.getDay()).getDays());
        return new SessionData(tss, Math.max(0, offset));
    }

    private double scorePlan(List<SessionPlan> plan, double startCtl, double startAtl,
            List<String> violations) {
        List<SessionData> sessions = plan.stream().map(this::toSessionData).toList();
        int maxDay = sessions.stream().mapToInt(SessionData::dayOffset).max().orElse(28);

        double adaptationGain = 0;
        double fatigueCost = 0;

        for (SessionData s : sessions) {
            int day = s.dayOffset();
            double tss = s.tss();
            double fitness = tss * (1 - Math.exp(-1.0 / TAU_FITNESS));
            double fatigue = tss * (1 - Math.exp(-1.0 / TAU_FATIGUE));
            double remainingFitness = fitness * Math.exp(-(maxDay - day) / TAU_FITNESS);
            double remainingFatigue = fatigue * Math.exp(-(maxDay - day) / TAU_FATIGUE);
            adaptationGain += remainingFitness;
            fatigueCost += remainingFatigue;
        }

        double constraintPenalty = evaluateConstraints(sessions, violations);

        return adaptationGain - fatigueCost - constraintPenalty;
    }

    private double evaluateConstraints(List<SessionData> sessions, List<String> violations) {
        double penalty = 0;
        return penalty;
    }

    private PlanResultDto buildPlanScore(String type, double score, List<SessionPlan> plan) {
        double gain = 0;
        double fatigue = 0;
        int maxDay = plan.stream()
                .mapToInt(s -> (int) (LocalDate.now().plusDays(1).until(s.day).getDays()))
                .max().orElse(28);

        for (var s : plan) {
            int day = (int) (LocalDate.now().plusDays(1).until(s.day).getDays());
            double tss = s.tss();
            double f = tss * (1 - Math.exp(-1.0 / TAU_FITNESS)) * Math.exp(-(maxDay - day) / TAU_FITNESS);
            double fa = tss * (1 - Math.exp(-1.0 / TAU_FATIGUE)) * Math.exp(-(maxDay - day) / TAU_FATIGUE);
            gain += f;
            fatigue += fa;
        }

        return PlanResultDto.builder()
                .type(type)
                .score(Math.round(score * 100.0) / 100.0)
                .adaptationGain(Math.round(gain * 100.0) / 100.0)
                .fatigueCost(Math.round(fatigue * 100.0) / 100.0)
                .build();
    }

    // ---- MONTE CARLO SIMULATION ----

    private double monteCarloSimulate(List<SessionData> sessions, double ctl, double atl) {
        double totalScore = 0;
        for (int i = 0; i < MONTE_CARLO_ITERATIONS; i++) {
            double simCtl = ctl;
            double simAtl = atl;
            int maxDay = sessions.stream().mapToInt(SessionData::dayOffset).max().orElse(28);

            for (int d = 0; d <= maxDay; d++) {
                double tss = 0;
                for (var s : sessions) {
                    if (s.dayOffset() == d) {
                        double perturbation = 1.0 + (rng.nextDouble() - 0.5) * 2 * TSS_VARIATION;
                        tss += s.tss() * perturbation;
                    }
                }
                simCtl = simCtl + (tss - simCtl) / TAU_FITNESS;
                simAtl = simAtl + (tss - simAtl) / TAU_FATIGUE;
            }

            double finalTsb = simCtl - simAtl;
            double performance = simCtl * 1.0 + finalTsb * 2.0 - Math.max(0, simAtl - simCtl * 1.2) * 3.0;
            totalScore += performance;
        }
        return totalScore / MONTE_CARLO_ITERATIONS;
    }

    // ---- HELPERS ----

    private int tssToDuration(double tss, int ftp) {
        double ifactor = 0.75;
        if (tss > 80) ifactor = 0.90;
        else if (tss > 60) ifactor = 0.82;
        double durationMin = (tss * ftp * 36) / (ftp * ifactor * ifactor * 100);
        return Math.max(30, (int) Math.round(durationMin / 5) * 5);
    }

    private OptimizedSessionDto toSessionDto(SessionPlan sp) {
        return OptimizedSessionDto.builder()
                .day(sp.day())
                .type(sp.type())
                .durationMinutes(sp.duration())
                .intensity(sp.intensity())
                .tss(BigDecimal.valueOf(Math.round(sp.tss())))
                .goal(sp.goal())
                .build();
    }

    private String buildReasoning(String focus, int daysToPeak, String planType) {
        if ("TAPER".equals(focus)) {
            return "Event za " + daysToPeak + " dni — taper aby zmaksymalizowac swiezosc przy zachowaniu formy.";
        }
        if ("BUILD".equals(focus)) {
            return daysToPeak > 50 ? "Brak eventu — faza progresywnej budowy."
                    : "Event za " + daysToPeak + " dni — faza budowy z progresywnym obciazeniem.";
        }
        return "Utrzymanie aktualnego poziomu formy.";
    }

    private int computeConfidence(OptimizePlanRequest request) {
        int confidence = 60;
        if (request.getCurrentCtl() != null) confidence += 8;
        if (request.getCurrentAtl() != null) confidence += 7;
        if (request.getFtp() > 0) confidence += 5;
        if (request.getEventDate() != null) confidence += 5;
        if (request.getTargetWeeklyTss() != null) confidence += 5;
        return Math.min(100, confidence);
    }

    // ---- PERSIST ----

    public TrainingPlanProgramDto applyOptimizedPlan(ApplyOptimizedPlanRequest request) {
        GoalPriority priority = resolveGoalPriority(request.getGoalPriority());
        LocalDate startDate = request.getSessions().stream()
                .map(s -> s.getDay())
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now().plusDays(1));
        LocalDate endDate = request.getSessions().stream()
                .map(s -> s.getDay())
                .max(LocalDate::compareTo)
                .orElse(startDate.plusDays(1));

        TrainingPlanProgram program = TrainingPlanProgram.builder()
                .name(request.getName())
                .goal(ProgramGoal.BUILD_BASE)
                .goalPriority(priority)
                .startDate(startDate)
                .endDate(endDate)
                .targetWeeklyTss(BigDecimal.valueOf(request.getTargetWeeklyTss()))
                .weekdayAvailabilityMinutes(75)
                .weekendAvailabilityMinutes(180)
                .preferredLongRideDay("SATURDAY")
                .environmentPreference("MIXED")
                .generatedBy("optimizer")
                .build();
        TrainingPlanProgram savedProgram = programRepository.save(program);

        short ftp = athleteProfileRepository.findFirst()
                .filter(p -> p.hasFtp())
                .map(p -> p.getFtpWatts())
                .orElse((short) 250);

        for (var session : request.getSessions()) {
            int powerTarget = ftp;
            if ("VO2_MAX".equals(session.getType())) powerTarget = (int) (ftp * 1.10);
            else if ("THRESHOLD".equals(session.getType())) powerTarget = (int) (ftp * 0.95);

            TrainingPlan plan = TrainingPlan.builder()
                    .date(session.getDay())
                    .plannedType(session.getType())
                    .plannedTss(session.getTss())
                    .plannedDurationMin(session.getDurationMinutes())
                    .plannedDescription(session.getGoal())
                    .programId(savedProgram.getId())
                    .targetPowerLowW((int) (powerTarget * 0.90))
                    .targetPowerHighW((int) (powerTarget * 1.05))
                    .status(TrainingPlanStatus.PLANNED)
                    .build();
            trainingPlanRepository.save(plan);
        }

        return TrainingPlanProgramDto.fromDomain(savedProgram);
    }

    private GoalPriority resolveGoalPriority(String value) {
        if ("A".equalsIgnoreCase(value)) return GoalPriority.A;
        if ("C".equalsIgnoreCase(value)) return GoalPriority.C;
        return GoalPriority.B;
    }

    // ---- INTERNAL RECORD ----

    record SessionPlan(LocalDate day, String type, int duration, String intensity, double tss, String goal) {}
}
