package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.CalendarActivitySummaryDto;
import pl.strava.analizator.application.dto.TrainingAdjustmentSuggestionDto;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.CoachMemoryPreferenceDto;
import pl.strava.analizator.application.dto.CoachMemorySummaryDto;
import pl.strava.analizator.application.dto.CreateTrainingPlanRequest;
import pl.strava.analizator.application.dto.GeneratePlanRequest;
import pl.strava.analizator.application.dto.RecordAdjustmentFeedbackRequest;
import pl.strava.analizator.application.dto.TrainingDayProjectionDto;
import pl.strava.analizator.application.dto.TrainingExecutionAssessmentDto;
import pl.strava.analizator.application.dto.TrainingGoalScorecardDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.application.dto.TrainingWeekObjectiveDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AdjustmentFeedbackDecision;
import pl.strava.analizator.domain.model.ProgramGoal;
import pl.strava.analizator.domain.model.GoalPriority;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.TrainingDayEnvironment;
import pl.strava.analizator.domain.model.TrainingAdjustmentFeedback;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanProgram;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.model.TrainingSessionRole;
import pl.strava.analizator.domain.model.TrainingSessionRoleResolver;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.PlannedRouteRepository;
import pl.strava.analizator.domain.port.TrainingAdjustmentFeedbackRepository;
import pl.strava.analizator.domain.port.TrainingDayEnvironmentPort;
import pl.strava.analizator.domain.port.TrainingPlanProgramRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;

@Service
@RequiredArgsConstructor
public class TrainingPlanService {

    private final TrainingPlanRepository trainingPlanRepository;
    private final TrainingPlanProgramRepository programRepository;
    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final PlannedRouteRepository plannedRouteRepository;
    private final TrainingDayEnvironmentPort trainingDayEnvironmentPort;
    private final TrainingAdjustmentFeedbackRepository trainingAdjustmentFeedbackRepository;

    // Mon=0%, Tue=15%, Wed=20%, Thu=0%, Fri=15%, Sat=30%, Sun=20%
    static final double[] DEFAULT_DAY_WEIGHTS = {0.0, 0.15, 0.20, 0.0, 0.15, 0.30, 0.20};
    static final short DEFAULT_FTP_WATTS = 200;
    static final int DEFAULT_WEEKDAY_AVAILABILITY_MINUTES = 75;
    static final int DEFAULT_WEEKEND_AVAILABILITY_MINUTES = 180;
    static final int OUTDOOR_BLOCK_THRESHOLD = 45;
    static final String DEFAULT_ENVIRONMENT_PREFERENCE = "MIXED";
    private static final int COACH_MEMORY_LOOKBACK_DAYS = 120;
    private static final int COACH_MEMORY_MIN_SIGNALS = 2;
    private static final double COACH_MEMORY_CLEAR_PREFERENCE = 0.65;

    private static final Set<WorkoutCategory> HARD_CATEGORIES = EnumSet.of(
            WorkoutCategory.THRESHOLD, WorkoutCategory.VO2MAX, WorkoutCategory.ANAEROBIC);

    private static final Set<WorkoutCategory> EASY_CATEGORIES = EnumSet.of(
            WorkoutCategory.ENDURANCE, WorkoutCategory.TEMPO);

    private static final Set<WorkoutCategory> RECOVERY_CATEGORIES = EnumSet.of(
            WorkoutCategory.RECOVERY, WorkoutCategory.ENDURANCE);

    private static final Set<WorkoutCategory> TEMPO_BLOCK_CATEGORIES = EnumSet.of(
            WorkoutCategory.TEMPO, WorkoutCategory.SWEET_SPOT, WorkoutCategory.ENDURANCE);

    private static final Set<WorkoutCategory> THRESHOLD_BLOCK_CATEGORIES = EnumSet.of(
            WorkoutCategory.THRESHOLD, WorkoutCategory.SWEET_SPOT, WorkoutCategory.ENDURANCE);

    private static final Set<WorkoutCategory> VO2_BLOCK_CATEGORIES = EnumSet.of(
            WorkoutCategory.VO2MAX, WorkoutCategory.ANAEROBIC, WorkoutCategory.ENDURANCE);

    private static final int STIMULUS_UNKNOWN = 0;
    private static final int STIMULUS_EASY = 1;
    private static final int STIMULUS_MODERATE = 2;
    private static final int STIMULUS_HARD = 3;

    public List<TrainingPlanDto> getPlans(LocalDate from, LocalDate to) {
        List<TrainingPlan> plans = trainingPlanRepository.findByDateRange(from, to);
        return plans.stream()
                .map(this::toDto)
                .toList();
    }

    public TrainingPlanDto createPlan(CreateTrainingPlanRequest request) {
        String plannedType = request.getPlannedType();
        BigDecimal plannedTss = request.getPlannedTss();
        Integer plannedDurationMin = request.getPlannedDurationMin();
        String plannedDescription = request.getPlannedDescription();

        if (request.getWorkoutTemplateId() != null) {
            WorkoutTemplate template = workoutTemplateRepository.findById(request.getWorkoutTemplateId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Workout template not found: " + request.getWorkoutTemplateId()));
            if (plannedType == null) {
                plannedType = template.getCategory().name();
            }
            if (plannedTss == null) {
                plannedTss = template.getTargetTss();
            }
            if (plannedDurationMin == null) {
                plannedDurationMin = template.getTargetDurationMin();
            }
            if (plannedDescription == null) {
                plannedDescription = template.getName();
            }
        }

        TrainingPlan plan = TrainingPlan.builder()
                .date(request.getDate())
                .plannedType(plannedType)
                .plannedTss(plannedTss)
                .plannedDurationMin(plannedDurationMin)
                .plannedDescription(plannedDescription)
                .programId(request.getProgramId())
                .workoutTemplateId(request.getWorkoutTemplateId())
                .status(TrainingPlanStatus.PLANNED)
                .notes(request.getNotes())
                .build();

        TrainingPlan saved = trainingPlanRepository.save(plan);
        return toDto(saved);
    }

    public void deletePlan(UUID id) {
        trainingPlanRepository.deleteById(id);
    }

    @Transactional
    public void updateStatus(UUID id, TrainingPlanStatus status) {
        trainingPlanRepository.updateStatus(id, status);
    }

    @Transactional
    public void recordAdjustmentFeedback(RecordAdjustmentFeedbackRequest request) {
        if (request == null || request.getDate() == null || request.getSuggestionType() == null || request.getFeedback() == null) {
            throw new IllegalArgumentException("Adjustment feedback requires date, suggestionType, and feedback.");
        }

        trainingAdjustmentFeedbackRepository.save(TrainingAdjustmentFeedback.builder()
                .date(request.getDate())
                .planId(request.getPlanId())
                .suggestionType(request.getSuggestionType())
                .suggestionTitle(request.getSuggestionTitle())
                .decision(AdjustmentFeedbackDecision.valueOf(request.getFeedback()))
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build());
    }

    public CoachMemorySummaryDto getCoachMemory() {
        List<TrainingAdjustmentFeedback> feedback = Optional.ofNullable(trainingAdjustmentFeedbackRepository.findByCreatedAtAfter(
                        OffsetDateTime.now(ZoneOffset.UTC).minusDays(COACH_MEMORY_LOOKBACK_DAYS)))
                .orElse(List.of());
        if (feedback.isEmpty()) {
            return CoachMemorySummaryDto.builder()
                    .headline("Planner dopiero uczy się twoich korekt.")
                    .coachNote("Brak zapisanej historii decyzji dla sugestii planera.")
                    .preferences(List.of())
                    .build();
        }

        List<CoachMemoryPreferenceDto> preferences = feedback.stream()
                .collect(Collectors.groupingBy(TrainingAdjustmentFeedback::getSuggestionType))
                .entrySet().stream()
                .map(entry -> toCoachMemoryPreference(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt(this::feedbackCount).reversed()
                        .thenComparing(CoachMemoryPreferenceDto::getSuggestionType))
                .toList();

        return CoachMemorySummaryDto.builder()
                .headline(buildCoachMemoryHeadline(preferences))
                .coachNote(buildCoachMemoryNote(preferences))
                .preferences(preferences)
                .build();
    }

    public List<CalendarDayDto> getCalendarView(LocalDate from, LocalDate to) {
        List<TrainingPlan> plans = trainingPlanRepository.findByDateRange(from, to);
        OffsetDateTime fromDateTime = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime toDateTime = to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(fromDateTime, toDateTime);
        CoachMemorySummaryDto coachMemory = getCoachMemory();

        Map<LocalDate, TrainingPlan> plansByDate = new LinkedHashMap<>();
        for (TrainingPlan plan : plans) {
            plansByDate.put(plan.getDate(), plan);
        }

        Map<LocalDate, Activity> activitiesByDate = new LinkedHashMap<>();
        for (Activity activity : activities) {
            LocalDate actDate = activity.getStartedAt().toLocalDate();
            activitiesByDate.put(actDate, activity);
        }

        Map<LocalDate, ProjectionContext> projectionsByDate = buildProjections(from, to, plans, coachMemory);

        List<UUID> activityIds = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tssValues = activityIds.isEmpty()
                ? Map.of()
                : activityMetricRepository.findNumericValues(activityIds, "tss");

        Map<LocalDate, CalendarDayDto> result = new LinkedHashMap<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            TrainingPlan plan = plansByDate.get(date);
            Activity activity = activitiesByDate.get(date);
            AdaptivePlanDecision adaptivePlan = buildAdaptivePlanDecision(date, plan, coachMemory);
            TrainingPlanDto planDto = adaptivePlan != null ? adaptivePlan.planDto() : (plan != null ? toDto(plan) : null);
            CalendarActivitySummaryDto activityDto = null;
            Double compliance = null;
            TrainingExecutionAssessmentDto execution = null;
            ProjectionContext projection = projectionsByDate.get(date);
            TrainingAdjustmentSuggestionDto adjustment = adaptivePlan != null
                    ? adaptivePlan.adjustment()
                    : projection != null ? projection.adjustment() : null;

            if (activity != null) {
                BigDecimal tss = tssValues.get(activity.getId());
                BigDecimal distanceKm = activity.getDistanceM() != null
                        ? activity.getDistanceM().divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP)
                        : null;
                Integer durationMin = activity.getMovingTimeSec() != null
                        ? activity.getMovingTimeSec() / 60
                        : null;

                activityDto = CalendarActivitySummaryDto.builder()
                        .id(activity.getId())
                        .name(activity.getName())
                        .sportType(activity.getSportType())
                        .durationMin(durationMin)
                        .distanceKm(distanceKm)
                        .tss(tss)
                        .build();

                if (plan != null && plan.getPlannedTss() != null && tss != null
                        && plan.getPlannedTss().compareTo(BigDecimal.ZERO) > 0) {
                    compliance = tss.divide(plan.getPlannedTss(), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue();
                }

                execution = assessExecution(plan, activity, activityDto, compliance);
            }

            result.put(date, CalendarDayDto.builder()
                    .date(date)
                    .planned(planDto)
                    .actual(activityDto)
                    .compliance(compliance)
                    .execution(execution)
                    .projection(projection != null ? projection.projection() : null)
                    .adjustment(adjustment)
                    .build());
        }

        return new ArrayList<>(result.values());
    }

    public List<TrainingPlanProgramDto> getPrograms() {
        return programRepository.findAll().stream()
                .map(program -> enrichProgramDto(program, trainingPlanRepository.findByProgramId(program.getId())))
                .toList();
    }

    public TrainingPlanProgramDto createProgram(TrainingPlanProgram program) {
        TrainingPlanProgram saved = programRepository.save(program);
        return TrainingPlanProgramDto.fromDomain(saved);
    }

    public void deleteProgram(UUID id) {
        programRepository.deleteById(id);
    }

    @Transactional
    public TrainingPlanProgramDto generatePlan(GeneratePlanRequest request) {
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = startDate.plusWeeks(request.getWeeks()).minusDays(1);
        GoalPriority goalPriority = resolveGoalPriority(request.getGoalPriority());
        LocalDate eventDate = normalizeEventDate(request.getEventDate(), startDate, endDate);
        LocalDate taperStartDate = determineTaperStartDate(goalPriority, eventDate, startDate, endDate);

        TrainingPlanProgram program = TrainingPlanProgram.builder()
                .name(request.getGoal() + " " + request.getWeeks() + "w")
                .goal(ProgramGoal.valueOf(request.getGoal()))
                .goalPriority(goalPriority)
                .startDate(startDate)
                .endDate(endDate)
                .eventDate(eventDate)
                .taperStartDate(taperStartDate)
                .targetWeeklyTss(request.getTargetWeeklyTss())
                .weekdayAvailabilityMinutes(resolveWeekdayAvailabilityMinutes(request))
                .weekendAvailabilityMinutes(resolveWeekendAvailabilityMinutes(request))
                .preferredLongRideDay(resolvePreferredLongRideDay(request).name())
                .environmentPreference(resolveEnvironmentPreference(request))
                .generatedBy("auto")
                .build();
        TrainingPlanProgram savedProgram = programRepository.save(program);

        short ftp = athleteProfileRepository.findFirst()
                .filter(p -> p.hasFtp())
                .map(p -> p.getFtpWatts())
                .orElse(DEFAULT_FTP_WATTS);

        List<WorkoutTemplate> allTemplates = workoutTemplateRepository.findAll();
        List<DayOfWeek> trainingDays = pickTrainingDays(request.getTrainingDaysPerWeek());
        DayOfWeek preferredLongRideDay = resolvePreferredLongRideDay(request);
        String environmentPreference = resolveEnvironmentPreference(request);
        List<TrainingWeekObjectiveDto> weeklyObjectives = new ArrayList<>();
        List<TrainingPlan> savedPlans = new ArrayList<>();

        WorkoutTemplate previousTemplate = null;
        for (int week = 0; week < request.getWeeks(); week++) {
            LocalDate weekStart = startDate.plusWeeks(week);
            WeekObjective weekObjective = determineWeekObjective(program.getGoal(), week, request.getWeeks());

            // 3:1 periodization — weeks 1-3 progressive, week 4 recovery
            int weekInCycle = week % 4;
            boolean isRecoveryWeek = weekInCycle == 3;
            BigDecimal weeklyTss;
            if (!isRecoveryWeek) {
                double progressionFactor = 0.95 + (weekInCycle * 0.05);
                weeklyTss = request.getTargetWeeklyTss()
                        .multiply(BigDecimal.valueOf(progressionFactor))
                        .setScale(2, RoundingMode.HALF_UP);
            } else {
                weeklyTss = request.getTargetWeeklyTss()
                        .multiply(BigDecimal.valueOf(0.60))
                        .setScale(2, RoundingMode.HALF_UP);
            }
            if (weekObjective.recoveryLike() && !isRecoveryWeek) {
                weeklyTss = weeklyTss.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP);
            }
            if (weekObjective.taperLike()) {
                weeklyTss = weeklyTss.multiply(BigDecimal.valueOf(0.75)).setScale(2, RoundingMode.HALF_UP);
            }

            double[] weights = computeDayWeights(trainingDays, preferredLongRideDay);
            double totalWeight = 0;
            for (double w : weights) totalWeight += w;
            int qualityDaysUsed = 0;
            List<TrainingPlan> savedWeekPlans = new ArrayList<>();

            for (DayOfWeek day : trainingDays) {
                LocalDate planDate = weekStart.with(day);
                if (planDate.isBefore(startDate) || planDate.isAfter(endDate)) continue;

                double dayWeight = weights[day.getValue() - 1];
                BigDecimal dayTss = weeklyTss.multiply(BigDecimal.valueOf(dayWeight / totalWeight))
                        .setScale(2, RoundingMode.HALF_UP);
                dayTss = applyTaper(dayTss, planDate, goalPriority, eventDate, taperStartDate);
                int durationCapMinutes = isWeekend(day)
                        ? resolveWeekendAvailabilityMinutes(request)
                        : resolveWeekdayAvailabilityMinutes(request);

                boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
                boolean afterHardDay = previousTemplate != null
                        && HARD_CATEGORIES.contains(previousTemplate.getCategory());

                WorkoutTemplate bestTemplate = selectTemplate(
                        allTemplates,
                        dayTss,
                        previousTemplate,
                        isWeekend,
                        afterHardDay,
                        isRecoveryWeek,
                        weekObjective,
                        qualityDaysUsed,
                        durationCapMinutes,
                        preferredLongRideDay,
                        day,
                        environmentPreference);

                Integer powerLow = null;
                Integer powerHigh = null;
                String plannedType = null;
                String description = null;
                Integer durationMin = null;

                if (bestTemplate != null) {
                    plannedType = bestTemplate.getCategory().name();
                    description = bestTemplate.getName();
                    durationMin = Math.min(bestTemplate.getTargetDurationMin(), durationCapMinutes);
                    if (bestTemplate.getIntensityFactor() != null) {
                        double avgPower = ftp * bestTemplate.getIntensityFactor().doubleValue();
                        powerLow = (int) (avgPower * 0.95);
                        powerHigh = (int) (avgPower * 1.05);
                    }
                }

                TrainingPlan plan = TrainingPlan.builder()
                        .date(planDate)
                        .plannedType(plannedType)
                        .plannedTss(dayTss)
                        .plannedDurationMin(durationMin)
                        .plannedDescription(description)
                        .programId(savedProgram.getId())
                        .workoutTemplateId(bestTemplate != null ? bestTemplate.getId() : null)
                        .targetPowerLowW(powerLow)
                        .targetPowerHighW(powerHigh)
                        .status(TrainingPlanStatus.PLANNED)
                        .build();

                trainingPlanRepository.save(plan);
                savedWeekPlans.add(plan);
                savedPlans.add(plan);
                if (bestTemplate != null && HARD_CATEGORIES.contains(bestTemplate.getCategory())) {
                    qualityDaysUsed++;
                }
                previousTemplate = bestTemplate;
            }
            weeklyObjectives.add(toWeeklyObjectiveDto(weekStart, weekObjective, weeklyTss, savedWeekPlans));
        }

        return mapProgramDto(savedProgram, weeklyObjectives, buildGoalScorecards(savedProgram, savedPlans, weeklyObjectives));
    }

    private TrainingPlanDto toDto(TrainingPlan plan) {
        String templateName = null;
        if (plan.getWorkoutTemplateId() != null) {
            templateName = workoutTemplateRepository.findById(plan.getWorkoutTemplateId())
                    .map(WorkoutTemplate::getName)
                    .orElse(null);
        }
        return TrainingPlanDto.fromDomain(plan, templateName, resolveTrainingRole(plan).name());
    }

    private AdaptivePlanDecision buildAdaptivePlanDecision(LocalDate date, TrainingPlan plan, CoachMemorySummaryDto coachMemory) {
        if (plan == null || date.isBefore(LocalDate.now(ZoneOffset.UTC)) || plan.getStatus() == TrainingPlanStatus.SKIPPED) {
            return null;
        }
        if (plan.getProgramId() == null) {
            return null;
        }

        TrainingPlanProgram program = programRepository.findById(plan.getProgramId()).orElse(null);
        if (program == null) {
            return null;
        }

        TrainingDayEnvironment environment = trainingDayEnvironmentPort.getEnvironmentFor(date).orElse(null);
        boolean routeSufficient = hasSufficientRoute(plan);
        if (!shouldAutoSwap(plan, program, environment, routeSufficient)) {
            return null;
        }

        WorkoutTemplate replacement = findAdaptiveReplacement(plan, program).orElse(null);
        if (replacement == null) {
            return null;
        }

        TrainingPlanDto replacementDto = TrainingPlanDto.builder()
                .id(plan.getId())
                .date(plan.getDate())
                .plannedType(replacement.getCategory().name())
                .plannedTss(replacement.getTargetTss())
                .plannedDurationMin(replacement.getTargetDurationMin())
                .plannedDescription(replacement.getName())
                .actualActivityId(plan.getActualActivityId())
                .compliancePct(plan.getCompliancePct())
                .programId(plan.getProgramId())
                .workoutTemplateId(replacement.getId())
                .workoutTemplateName(replacement.getName())
                .targetPowerLowW(plan.getTargetPowerLowW())
                .targetPowerHighW(plan.getTargetPowerHighW())
                .sessionRole(resolveTrainingRole(replacement.getCategory(), replacement.getTargetDurationMin()).name())
                .status(plan.getStatus().name())
                .notes(plan.getNotes())
                .createdAt(plan.getCreatedAt())
                .build();

        String weatherSummary = environment != null
                ? "%s (%d/%d)".formatted(environment.getWeatherDescription(), environment.getOutdoorScore(), environment.getBestWindowScore())
                : "brak sensownej trasy outdoor";
        TrainingAdjustmentSuggestionDto adjustment = TrainingAdjustmentSuggestionDto.builder()
                .type("AUTO_SWAP")
                .title("Auto-swap: lepszy wariant dnia")
                .description("Plan podmienił sesję na równoważny wariant, bo warunki outdoor są słabe albo brakuje sensownej trasy. "
                        + "Powód: " + weatherSummary + ".")
                .memoryHint(buildAdjustmentMemoryHint("AUTO_SWAP", coachMemory))
                .build();
        return new AdaptivePlanDecision(replacementDto, adjustment);
    }

    private boolean shouldAutoSwap(
            TrainingPlan plan,
            TrainingPlanProgram program,
            TrainingDayEnvironment environment,
            boolean routeSufficient) {
        if ("INDOOR_FRIENDLY".equals(program.getEnvironmentPreference())) {
            return false;
        }
        boolean weatherBlocked = environment != null
                && Math.max(environment.getOutdoorScore(), environment.getBestWindowScore()) < OUTDOOR_BLOCK_THRESHOLD;
        boolean routeBlocked = !routeSufficient && isLongRideLike(plan);
        return weatherBlocked || routeBlocked;
    }

    private boolean hasSufficientRoute(TrainingPlan plan) {
        if (!isLongRideLike(plan)) {
            return true;
        }
        int minimumSeconds = Math.max(60 * 60, (int) ((plan.getPlannedDurationMin() != null ? plan.getPlannedDurationMin() : 0) * 60 * 0.7));
        return plannedRouteRepository.findAll().stream()
                .map(PlannedRoute::getEstimatedTimeSec)
                .filter(duration -> duration != null)
                .anyMatch(duration -> duration >= minimumSeconds);
    }

    private boolean isLongRideLike(TrainingPlan plan) {
        return "ENDURANCE".equals(plan.getPlannedType())
                && plan.getPlannedDurationMin() != null
                && plan.getPlannedDurationMin() >= 120;
    }

    private Optional<WorkoutTemplate> findAdaptiveReplacement(TrainingPlan plan, TrainingPlanProgram program) {
        List<WorkoutTemplate> templates = workoutTemplateRepository.findAll();
        TrainingSessionRole role = resolveTrainingRole(plan);
        return templates.stream()
                .filter(template -> !template.getId().equals(plan.getWorkoutTemplateId()))
                .filter(template -> TrainingSessionRoleResolver.matchesAdaptiveRole(role, template))
                .filter(template -> matchesAdaptiveEnvironment(program, template))
                .sorted(Comparator.comparingInt(template -> adaptivePriority(role, template)))
                .findFirst();
    }

    private TrainingSessionRole resolveTrainingRole(TrainingPlan plan) {
        return TrainingSessionRoleResolver.fromPlan(plan);
    }

    private TrainingSessionRole resolveTrainingRole(WorkoutCategory category, Integer durationMin) {
        return TrainingSessionRoleResolver.fromCategory(category, durationMin);
    }

    private boolean matchesAdaptiveEnvironment(TrainingPlanProgram program, WorkoutTemplate template) {
        if (!"OUTDOOR_FOCUSED".equals(program.getEnvironmentPreference())) {
            return true;
        }
        return template.getName().toLowerCase().contains("indoor")
                || template.getCategory() == WorkoutCategory.SWEET_SPOT
                || template.getTargetDurationMin() <= 90;
    }

    private int adaptivePriority(TrainingSessionRole role, WorkoutTemplate template) {
        int priority = 0;
        String lowerName = template.getName() != null ? template.getName().toLowerCase() : "";
        if (lowerName.contains("indoor")) {
            priority -= 20;
        }
        if (role == TrainingSessionRole.LONG_ENDURANCE && template.getCategory() == WorkoutCategory.SWEET_SPOT) {
            priority -= 10;
        }
        if (template.getTargetDurationMin() <= 90) {
            priority -= 5;
        }
        return priority;
    }

    private Map<LocalDate, ProjectionContext> buildProjections(
            LocalDate from,
            LocalDate to,
            List<TrainingPlan> displayedPlans,
            CoachMemorySummaryDto coachMemory) {
        LocalDate today = LocalDate.now();
        if (!to.isAfter(today)) {
            return Map.of();
        }

        LocalDate projectionStart = today.plusDays(1);
        List<TrainingPlan> projectionPlans = from.isAfter(today)
                ? trainingPlanRepository.findByDateRange(today, to)
                : displayedPlans;

        Map<LocalDate, TrainingPlan> planByDate = new LinkedHashMap<>();
        for (TrainingPlan plan : projectionPlans) {
            planByDate.put(plan.getDate(), plan);
        }

        BigDecimal ctlValue = dailyMetricRepository.findNumericValue(today, "ctl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "ctl"))
                .orElse(BigDecimal.ZERO);
        BigDecimal atlValue = dailyMetricRepository.findNumericValue(today, "atl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "atl"))
                .orElse(BigDecimal.ZERO);

        double ctl = ctlValue.doubleValue();
        double atl = atlValue.doubleValue();
        Map<UUID, TrainingPlanProgram> programs = new HashMap<>();
        TrainingPlan previousPlanned = null;
        Map<LocalDate, ProjectionContext> result = new LinkedHashMap<>();

        for (LocalDate date = projectionStart; !date.isAfter(to); date = date.plusDays(1)) {
            TrainingPlan plan = planByDate.get(date);
            double plannedTss = plan != null && plan.getStatus() != TrainingPlanStatus.SKIPPED && plan.getPlannedTss() != null
                    ? plan.getPlannedTss().doubleValue()
                    : 0.0;
            double projectedTsb = ctl - atl;
            double projectedCtl = ctl + (plannedTss - ctl) / 42.0;
            double projectedAtl = atl + (plannedTss - atl) / 7.0;
            int projectedReadiness = calculateReadinessScore(projectedTsb, projectedCtl, projectedAtl);
            DayTypeDecision projectedDayType = classifyProjectionDayType(projectedReadiness, projectedTsb, projectedCtl, projectedAtl);
            boolean taperDay = isTaperDay(plan, date, programs);

            TrainingDayProjectionDto projection = TrainingDayProjectionDto.builder()
                    .plannedTss(round(plannedTss))
                    .projectedCtl(round(projectedCtl))
                    .projectedAtl(round(projectedAtl))
                    .projectedTsb(round(projectedTsb))
                    .projectedReadiness(projectedReadiness)
                    .dayType(projectedDayType.type())
                    .dayLabel(projectedDayType.label())
                    .taperDay(taperDay)
                    .build();

            TrainingAdjustmentSuggestionDto adjustment = buildAdjustmentSuggestion(
                    date, plan, previousPlanned, projectedTsb, projectedReadiness, taperDay, coachMemory);

            result.put(date, new ProjectionContext(projection, adjustment));

            if (plan != null && plannedTss > 0) {
                previousPlanned = plan;
            }
            ctl = projectedCtl;
            atl = projectedAtl;
        }
        return result;
    }

    private TrainingAdjustmentSuggestionDto buildAdjustmentSuggestion(
            LocalDate date,
            TrainingPlan currentPlan,
            TrainingPlan previousPlanned,
            double projectedTsb,
            int projectedReadiness,
            boolean taperDay,
            CoachMemorySummaryDto coachMemory) {
        if (currentPlan == null || currentPlan.getPlannedTss() == null || currentPlan.getPlannedTss().compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        if (taperDay && currentPlan.getPlannedTss().compareTo(BigDecimal.valueOf(75)) > 0) {
            return buildAdjustmentSuggestion(
                    "TAPER",
                    "Zostaw świeżość na start",
                    "Ten dzień wpada już w taper — skróć objętość i zostaw tylko krótki akcent.",
                    coachMemory);
        }
        if (projectedTsb < -25 && currentPlan.getPlannedTss().compareTo(BigDecimal.valueOf(80)) >= 0) {
            return buildAdjustmentSuggestion(
                    "LIGHTEN",
                    "Zdejmij intensywność",
                    "Prognozowany TSB jest bardzo niski. Zamień ten dzień na tlen albo skróć akcent o 20-30%.",
                    coachMemory);
        }
        if (projectedReadiness < 35 && currentPlan.getPlannedTss().compareTo(BigDecimal.valueOf(60)) >= 0) {
            return buildAdjustmentSuggestion(
                    "RECOVER",
                    "Włóż dzień regeneracyjny",
                    "Świeżość spada za mocno. Warto wstawić lekki spin lub pełne wolne zamiast kolejnego bodźca.",
                    coachMemory);
        }
        if (previousPlanned != null
                && isHardDay(previousPlanned)
                && isHardDay(currentPlan)
                && ChronoUnit.DAYS.between(previousPlanned.getDate(), date) == 1) {
            return buildAdjustmentSuggestion(
                    "SHIFT",
                    "Rozbij dwa mocne dni",
                    "Dwa ciężkie dni pod rząd pogorszą świeżość. Przesuń ten akcent albo zamień go na spokojny tlen.",
                    coachMemory);
        }
        return null;
    }

    private TrainingAdjustmentSuggestionDto buildAdjustmentSuggestion(
            String type,
            String title,
            String description,
            CoachMemorySummaryDto coachMemory) {
        return TrainingAdjustmentSuggestionDto.builder()
                .type(type)
                .title(title)
                .description(description)
                .memoryHint(buildAdjustmentMemoryHint(type, coachMemory))
                .build();
    }

    private String buildAdjustmentMemoryHint(String suggestionType, CoachMemorySummaryDto coachMemory) {
        if (coachMemory == null || coachMemory.getPreferences() == null) {
            return null;
        }
        CoachMemoryPreferenceDto preference = coachMemory.getPreferences().stream()
                .filter(candidate -> suggestionType.equals(candidate.getSuggestionType()))
                .findFirst()
                .orElse(null);
        if (preference == null || feedbackCount(preference) < COACH_MEMORY_MIN_SIGNALS) {
            return null;
        }
        if (preference.getAcceptanceRate() >= COACH_MEMORY_CLEAR_PREFERENCE) {
            return "Pamięć coacha: zwykle akceptujesz takie korekty — " + preference.getGuidance();
        }
        if (preference.getAcceptanceRate() <= (1 - COACH_MEMORY_CLEAR_PREFERENCE)) {
            return "Pamięć coacha: zwykle odrzucasz taki ruch — " + preference.getGuidance();
        }
        return "Pamięć coacha: przy tej korekcie decyzje są mieszane.";
    }

    private CoachMemoryPreferenceDto toCoachMemoryPreference(String suggestionType, List<TrainingAdjustmentFeedback> feedback) {
        int accepted = (int) feedback.stream()
                .filter(entry -> entry.getDecision() == AdjustmentFeedbackDecision.ACCEPTED)
                .count();
        int rejected = feedback.size() - accepted;
        double acceptanceRate = feedback.isEmpty() ? 0.0 : (double) accepted / feedback.size();
        return CoachMemoryPreferenceDto.builder()
                .suggestionType(suggestionType)
                .acceptedCount(accepted)
                .rejectedCount(rejected)
                .acceptanceRate(round(acceptanceRate * 100.0).doubleValue() / 100.0)
                .guidance(buildCoachMemoryGuidance(suggestionType, acceptanceRate))
                .build();
    }

    private String buildCoachMemoryHeadline(List<CoachMemoryPreferenceDto> preferences) {
        CoachMemoryPreferenceDto strongest = preferences.stream().findFirst().orElse(null);
        if (strongest == null || feedbackCount(strongest) < COACH_MEMORY_MIN_SIGNALS) {
            return "Planner dopiero łapie twoje wzorce decyzji.";
        }
        if (strongest.getAcceptanceRate() >= COACH_MEMORY_CLEAR_PREFERENCE) {
            return strongest.getSuggestionType() + " zwykle przechodzi bez tarcia.";
        }
        if (strongest.getAcceptanceRate() <= (1 - COACH_MEMORY_CLEAR_PREFERENCE)) {
            return strongest.getSuggestionType() + " zwykle odbija się od twojej decyzji.";
        }
        return "Pamięć korekt jest jeszcze mieszana.";
    }

    private String buildCoachMemoryNote(List<CoachMemoryPreferenceDto> preferences) {
        List<String> highlights = preferences.stream()
                .filter(preference -> feedbackCount(preference) >= COACH_MEMORY_MIN_SIGNALS)
                .map(preference -> {
                    if (preference.getAcceptanceRate() >= COACH_MEMORY_CLEAR_PREFERENCE) {
                        return preference.getSuggestionType() + " zwykle akceptowany";
                    }
                    if (preference.getAcceptanceRate() <= (1 - COACH_MEMORY_CLEAR_PREFERENCE)) {
                        return preference.getSuggestionType() + " częściej odrzucany";
                    }
                    return preference.getSuggestionType() + " nadal bez jasnego wzorca";
                })
                .limit(3)
                .toList();
        if (highlights.isEmpty()) {
            return "Brakuje jeszcze powtarzalnych decyzji, żeby mocniej personalizować korekty.";
        }
        return String.join(". ", highlights) + ".";
    }

    private String buildCoachMemoryGuidance(String suggestionType, double acceptanceRate) {
        if (acceptanceRate >= COACH_MEMORY_CLEAR_PREFERENCE) {
            return switch (suggestionType) {
                case "LIGHTEN" -> "najpierw tniesz koszt zamiast kasować bodziec.";
                case "SHIFT" -> "lepiej działa przesunięcie bodźca niż jazda na siłę.";
                case "RECOVER" -> "regeneracja zwykle ratuje kolejny ważny dzień.";
                case "AUTO_SWAP" -> "równoważny wariant dnia zwykle ci pasuje.";
                case "TAPER" -> "ochrona świeżości przed ważnym terminem zwykle się broni.";
                default -> "ten typ korekty zwykle dobrze trafia.";
            };
        }
        if (acceptanceRate <= (1 - COACH_MEMORY_CLEAR_PREFERENCE)) {
            return switch (suggestionType) {
                case "LIGHTEN" -> "częściej bronisz pełnego bodźca albo wolisz przesunięcie.";
                case "SHIFT" -> "rzadko przesuwasz akcent, więc potrzebna jest mocniejsza alternatywa na dziś.";
                case "RECOVER" -> "pełne odpuszczenie rzadko jest twoim pierwszym wyborem.";
                case "AUTO_SWAP" -> "automat warto traktować jako awaryjne obejście, nie domyślny ruch.";
                case "TAPER" -> "zwykle chcesz jeszcze podtrzymać rytm zamiast mocno odcinać koszt.";
                default -> "ten typ korekty wymaga lepszego uzasadnienia.";
            };
        }
        return "przy tym ruchu decyzje są jeszcze mieszane.";
    }

    private int feedbackCount(CoachMemoryPreferenceDto preference) {
        return preference.getAcceptedCount() + preference.getRejectedCount();
    }

    private boolean isHardDay(TrainingPlan plan) {
        if (plan.getPlannedTss() == null) {
            return false;
        }
        if (plan.getPlannedTss().compareTo(BigDecimal.valueOf(80)) >= 0) {
            return true;
        }
        if (plan.getPlannedType() == null) {
            return false;
        }
        return Set.of("THRESHOLD", "VO2MAX", "ANAEROBIC", "SWEET_SPOT").contains(plan.getPlannedType());
    }

    private int calculateReadinessScore(double tsb, double ctl, double atl) {
        double tsbScore = Math.max(0, Math.min(60, (tsb + 30) * 2));
        double fitnessBonus = Math.min(25, ctl * 0.5);
        double fatiguePenalty = 0;
        if (ctl > 0 && atl > ctl * 1.3) {
            fatiguePenalty = Math.min(15, (atl - ctl) * 0.5);
        }
        return (int) Math.round(Math.max(0, Math.min(100, tsbScore + fitnessBonus - fatiguePenalty)));
    }

    private DayTypeDecision classifyProjectionDayType(int score, double tsb, double ctl, double atl) {
        double atlCtlRatio = ctl > 0 ? atl / ctl : 0;
        if (score < 20 || tsb < -30 || atlCtlRatio >= 1.45) {
            return new DayTypeDecision("OFF", "Wolne");
        }
        if (score < 35 || tsb < -20 || atlCtlRatio >= 1.35) {
            return new DayTypeDecision("RECOVERY", "Regeneracja");
        }
        if (score < 55 || tsb < -5) {
            return new DayTypeDecision("ENDURANCE", "Tlen");
        }
        if (score < 70 || tsb < 5) {
            return new DayTypeDecision("TEMPO", "Tempo");
        }
        if (score < 85 || tsb < 12) {
            return new DayTypeDecision("THRESHOLD", "Próg");
        }
        return new DayTypeDecision("HIGH_INTENSITY", "Mocny bodziec");
    }

    private GoalPriority resolveGoalPriority(String goalPriority) {
        if (goalPriority == null || goalPriority.isBlank()) {
            return GoalPriority.B;
        }
        return GoalPriority.valueOf(goalPriority);
    }

    private LocalDate normalizeEventDate(LocalDate eventDate, LocalDate startDate, LocalDate endDate) {
        if (eventDate == null || eventDate.isBefore(startDate) || eventDate.isAfter(endDate)) {
            return null;
        }
        return eventDate;
    }

    private LocalDate determineTaperStartDate(
            GoalPriority goalPriority,
            LocalDate eventDate,
            LocalDate startDate,
            LocalDate endDate) {
        if (eventDate == null) {
            return null;
        }
        int taperDays = switch (goalPriority) {
            case A -> 14;
            case B -> 7;
            case C -> 3;
        };
        LocalDate taperStartDate = eventDate.minusDays(taperDays - 1L);
        if (taperStartDate.isBefore(startDate) || taperStartDate.isAfter(endDate)) {
            return startDate;
        }
        return taperStartDate;
    }

    private BigDecimal applyTaper(
            BigDecimal originalTss,
            LocalDate planDate,
            GoalPriority goalPriority,
            LocalDate eventDate,
            LocalDate taperStartDate) {
        if (eventDate == null || taperStartDate == null || planDate.isBefore(taperStartDate) || planDate.isAfter(eventDate)) {
            return originalTss;
        }

        long daysUntilEvent = ChronoUnit.DAYS.between(planDate, eventDate);
        double factor;
        if (daysUntilEvent <= 1) {
            factor = 0.45;
        } else if (daysUntilEvent <= 3) {
            factor = 0.60;
        } else {
            factor = switch (goalPriority) {
                case A -> 0.75;
                case B -> 0.80;
                case C -> 0.90;
            };
        }
        return originalTss.multiply(BigDecimal.valueOf(factor)).setScale(2, RoundingMode.HALF_UP);
    }

    private boolean isTaperDay(
            TrainingPlan plan,
            LocalDate date,
            Map<UUID, TrainingPlanProgram> programs) {
        if (plan == null || plan.getProgramId() == null) {
            return false;
        }
        TrainingPlanProgram program = programs.computeIfAbsent(
                plan.getProgramId(),
                id -> programRepository.findById(id).orElse(null));
        return program != null
                && program.getTaperStartDate() != null
                && !date.isBefore(program.getTaperStartDate())
                && !date.isAfter(program.getEndDate());
    }

    private BigDecimal round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private record ProjectionContext(
            TrainingDayProjectionDto projection,
            TrainingAdjustmentSuggestionDto adjustment) {
    }

    private record AdaptivePlanDecision(
            TrainingPlanDto planDto,
            TrainingAdjustmentSuggestionDto adjustment) {
    }

    private record ExecutionReviewDetails(
            Double intervalCompliance,
            Double zoneCompliance,
            String primaryLimiter,
            String nextDayAdvice) {
        private boolean hasStructuredReview() {
            return intervalCompliance != null || zoneCompliance != null;
        }
    }

    private record TargetZone(int lowPct, int highPct) {
    }

    private record ExecutionOutcome(String type, String label, String description) {
    }

    private record WeeklyFuelingAdvice(String label, String guidance) {
    }

    private record DayTypeDecision(String type, String label) {
    }

    List<DayOfWeek> pickTrainingDays(int count) {
        List<DayOfWeek> preferred = List.of(
                DayOfWeek.SATURDAY, DayOfWeek.WEDNESDAY, DayOfWeek.TUESDAY,
                DayOfWeek.SUNDAY, DayOfWeek.FRIDAY, DayOfWeek.THURSDAY, DayOfWeek.MONDAY
        );
        List<DayOfWeek> picked = preferred.subList(0, Math.min(count, 7));
        return picked.stream().sorted(Comparator.comparingInt(DayOfWeek::getValue)).toList();
    }

    double[] computeDayWeights(List<DayOfWeek> trainingDays) {
        return computeDayWeights(trainingDays, DayOfWeek.SATURDAY);
    }

    double[] computeDayWeights(List<DayOfWeek> trainingDays, DayOfWeek preferredLongRideDay) {
        double[] weights = new double[7];
        for (DayOfWeek day : trainingDays) {
            weights[day.getValue() - 1] = DEFAULT_DAY_WEIGHTS[day.getValue() - 1];
            if (weights[day.getValue() - 1] == 0.0) {
                weights[day.getValue() - 1] = 0.15;
            }
        }
        if (preferredLongRideDay == DayOfWeek.SUNDAY
                && weights[DayOfWeek.SATURDAY.getValue() - 1] > 0
                && weights[DayOfWeek.SUNDAY.getValue() - 1] > 0) {
            double saturdayWeight = weights[DayOfWeek.SATURDAY.getValue() - 1];
            weights[DayOfWeek.SATURDAY.getValue() - 1] = weights[DayOfWeek.SUNDAY.getValue() - 1];
            weights[DayOfWeek.SUNDAY.getValue() - 1] = saturdayWeight;
        }
        return weights;
    }

    WorkoutTemplate findBestTemplateByTss(List<WorkoutTemplate> templates, BigDecimal targetTss) {
        if (templates.isEmpty() || targetTss == null) return null;
        return templates.stream()
                .filter(t -> t.getTargetTss() != null)
                .min(Comparator.comparing(t -> t.getTargetTss().subtract(targetTss).abs()))
                .orElse(null);
    }

    WorkoutTemplate selectTemplate(List<WorkoutTemplate> templates, BigDecimal targetTss,
            WorkoutTemplate previousTemplate, boolean isWeekend, boolean afterHardDay, boolean isRecoveryWeek,
            WeekObjective weekObjective, int qualityDaysUsed, int durationCapMinutes,
            DayOfWeek preferredLongRideDay, DayOfWeek currentDay, String environmentPreference) {
        if (templates.isEmpty() || targetTss == null) return null;

        List<WorkoutTemplate> candidates = templates.stream()
                .filter(t -> t.getTargetTss() != null)
                .toList();
        if (candidates.isEmpty()) return null;
        List<WorkoutTemplate> baseCandidates = candidates;

        List<WorkoutTemplate> withinDuration = candidates.stream()
                .filter(t -> t.getTargetDurationMin() <= durationCapMinutes)
                .toList();
        if (!withinDuration.isEmpty()) {
            candidates = withinDuration;
        }

        // Avoid same template two days in a row
        if (previousTemplate != null && !isRecoveryWeek) {
            List<WorkoutTemplate> withoutPrev = candidates.stream()
                    .filter(t -> !t.getId().equals(previousTemplate.getId()))
                    .toList();
            if (!withoutPrev.isEmpty()) candidates = withoutPrev;
        }

        // Recovery weeks: restrict to RECOVERY/ENDURANCE templates
        if (isRecoveryWeek) {
            List<WorkoutTemplate> recoveryOnly = candidates.stream()
                    .filter(t -> RECOVERY_CATEGORIES.contains(t.getCategory()))
                    .toList();
            if (!recoveryOnly.isEmpty()) candidates = recoveryOnly;
        }

        if (qualityDaysUsed >= weekObjective.maxQualityDays()) {
            List<WorkoutTemplate> easyOnly = candidates.stream()
                    .filter(t -> !HARD_CATEGORIES.contains(t.getCategory()))
                    .toList();
            if (easyOnly.isEmpty()) {
                easyOnly = baseCandidates.stream()
                        .filter(t -> !HARD_CATEGORIES.contains(t.getCategory()))
                        .toList();
            }
            if (!easyOnly.isEmpty()) candidates = easyOnly;
        }

        List<WorkoutTemplate> objectiveMatched = candidates.stream()
                .filter(t -> weekObjective.preferredCategories().contains(t.getCategory()))
                .toList();
        if (!objectiveMatched.isEmpty()) candidates = objectiveMatched;

        List<WorkoutTemplate> environmentMatched = matchEnvironmentPreference(candidates, environmentPreference, isWeekend);
        if (!environmentMatched.isEmpty()) {
            candidates = environmentMatched;
        }

        if (currentDay == preferredLongRideDay) {
            WorkoutTemplate longRide = candidates.stream()
                    .filter(t -> t.getCategory() == WorkoutCategory.ENDURANCE
                            && t.getName().toLowerCase().contains("long ride"))
                    .min(Comparator.comparing(t -> t.getTargetTss().subtract(targetTss).abs()))
                    .orElse(null);
            if (longRide != null) return longRide;
        }

        // Hard/easy alternation: after a hard day prefer easy templates
        if (afterHardDay) {
            List<WorkoutTemplate> easyOnly = candidates.stream()
                    .filter(t -> EASY_CATEGORIES.contains(t.getCategory()))
                    .toList();
            if (easyOnly.isEmpty()) {
                easyOnly = baseCandidates.stream()
                        .filter(t -> EASY_CATEGORIES.contains(t.getCategory()))
                        .toList();
            }
            if (!easyOnly.isEmpty()) candidates = easyOnly;
        }

        return candidates.stream()
                .min(Comparator.comparing(t -> t.getTargetTss().subtract(targetTss).abs()))
                .orElse(null);
    }

    private List<WorkoutTemplate> matchEnvironmentPreference(
            List<WorkoutTemplate> candidates,
            String environmentPreference,
            boolean isWeekend) {
        if (DEFAULT_ENVIRONMENT_PREFERENCE.equals(environmentPreference)) {
            return candidates;
        }
        if ("INDOOR_FRIENDLY".equals(environmentPreference) && !isWeekend) {
            return candidates.stream()
                    .filter(t -> Set.of(
                            WorkoutCategory.RECOVERY,
                            WorkoutCategory.ENDURANCE,
                            WorkoutCategory.TEMPO,
                            WorkoutCategory.SWEET_SPOT,
                            WorkoutCategory.THRESHOLD,
                            WorkoutCategory.VO2MAX).contains(t.getCategory()))
                    .toList();
        }
        if ("OUTDOOR_FOCUSED".equals(environmentPreference)) {
            return candidates.stream()
                    .filter(t -> Set.of(
                            WorkoutCategory.ENDURANCE,
                            WorkoutCategory.TEMPO,
                            WorkoutCategory.THRESHOLD).contains(t.getCategory()))
                    .toList();
        }
        return candidates;
    }

    private TrainingPlanProgramDto enrichProgramDto(TrainingPlanProgram program, List<TrainingPlan> plans) {
        List<TrainingWeekObjectiveDto> weeklyObjectives = buildWeeklyObjectives(program, plans);
        return mapProgramDto(program, weeklyObjectives, buildGoalScorecards(program, plans, weeklyObjectives));
    }

    private TrainingExecutionAssessmentDto assessExecution(
            TrainingPlan plan,
            Activity sourceActivity,
            CalendarActivitySummaryDto activity,
            Double tssCompliance) {
        if (plan == null || activity == null) {
            return null;
        }

        Double durationCompliance = null;
        if (plan.getPlannedDurationMin() != null && plan.getPlannedDurationMin() > 0 && activity.getDurationMin() != null) {
            durationCompliance = BigDecimal.valueOf(activity.getDurationMin())
                    .divide(BigDecimal.valueOf(plan.getPlannedDurationMin()), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        int plannedStimulus = resolvePlannedStimulus(plan.getPlannedType());
        int actualStimulus = resolveActualStimulus(activity);
        boolean stimulusMatch = plannedStimulus == STIMULUS_UNKNOWN
                || actualStimulus == STIMULUS_UNKNOWN
                || plannedStimulus == actualStimulus;

        int tssScore = scoreFromCompliance(tssCompliance, 10.0, 35.0);
        int durationScore = scoreFromCompliance(durationCompliance, 15.0, 45.0);
        int stimulusScore = (plannedStimulus == STIMULUS_UNKNOWN || actualStimulus == STIMULUS_UNKNOWN)
                ? 70
                : (stimulusMatch ? 100 : 35);
        ExecutionReviewDetails reviewDetails = buildExecutionReview(plan, sourceActivity, activity, tssCompliance, durationCompliance);
        int reviewScore = reviewDetails.hasStructuredReview()
                ? (int) Math.round((scoreFromCompliance(reviewDetails.intervalCompliance(), 12.0, 40.0) * 0.60)
                + (scoreFromCompliance(reviewDetails.zoneCompliance(), 15.0, 45.0) * 0.40))
                : 70;
        int score = (int) Math.round((tssScore * 0.35) + (durationScore * 0.20) + (stimulusScore * 0.15) + (reviewScore * 0.30));

        ExecutionOutcome outcome = determineExecutionOutcome(
                tssCompliance,
                durationCompliance,
                plannedStimulus,
                actualStimulus,
                stimulusMatch,
                score);

        return TrainingExecutionAssessmentDto.builder()
                .outcome(outcome.type())
                .label(outcome.label())
                .description(outcome.description())
                .score(score)
                .tssCompliance(tssCompliance)
                .durationCompliance(durationCompliance)
                .intervalCompliance(reviewDetails.intervalCompliance())
                .zoneCompliance(reviewDetails.zoneCompliance())
                .stimulusMatch(stimulusMatch)
                .primaryLimiter(reviewDetails.primaryLimiter())
                .nextDayAdvice(reviewDetails.nextDayAdvice())
                .build();
    }

    private ExecutionReviewDetails buildExecutionReview(
            TrainingPlan plan,
            Activity activity,
            CalendarActivitySummaryDto activityDto,
            Double tssCompliance,
            Double durationCompliance) {
        if (activity == null) {
            return fallbackReviewDetails(tssCompliance, durationCompliance, null, null);
        }

        Optional<WorkoutTemplate> template = plan.getWorkoutTemplateId() != null
                ? workoutTemplateRepository.findById(plan.getWorkoutTemplateId())
                : Optional.empty();
        short ftpWatts = athleteProfileRepository.findFirst()
                .map(profile -> profile.getFtpWatts() != null ? profile.getFtpWatts() : DEFAULT_FTP_WATTS)
                .orElse(DEFAULT_FTP_WATTS);

        Double intervalCompliance = template
                .map(workoutTemplate -> calculateIntervalCompliance(workoutTemplate, activity, ftpWatts))
                .orElse(null);
        Double zoneCompliance = template
                .map(workoutTemplate -> calculateTemplateCompliance(workoutTemplate, activity, ftpWatts))
                .orElseGet(() -> calculatePlannedTypeZoneCompliance(plan.getPlannedType(), activity, ftpWatts));
        return fallbackReviewDetails(tssCompliance, durationCompliance, intervalCompliance, zoneCompliance);
    }

    private ExecutionReviewDetails fallbackReviewDetails(
            Double tssCompliance,
            Double durationCompliance,
            Double intervalCompliance,
            Double zoneCompliance) {
        String limiter = determinePrimaryLimiter(tssCompliance, durationCompliance, intervalCompliance, zoneCompliance);
        return new ExecutionReviewDetails(
                intervalCompliance,
                zoneCompliance,
                limiter,
                determineNextDayAdvice(limiter, tssCompliance, durationCompliance, intervalCompliance, zoneCompliance));
    }

    private Double calculateIntervalCompliance(WorkoutTemplate template, Activity activity, short ftpWatts) {
        if (!activity.hasPowerData() || template.getSteps() == null || template.getSteps().isEmpty()) {
            return null;
        }

        int cursor = 0;
        int targetSeconds = 0;
        double matchedSeconds = 0.0;
        for (WorkoutStep step : template.getSteps()) {
            if (step.getRepeat() != null && step.getOnDurationSec() != null) {
                int repeats = Math.max(1, step.getRepeat());
                for (int index = 0; index < repeats; index++) {
                    targetSeconds += step.getOnDurationSec();
                    matchedSeconds += matchingSeconds(activity.getPowerStream(), cursor, step.getOnDurationSec(),
                            ftpWatts, step.getOnPowerPctFtpLow(), step.getOnPowerPctFtpHigh());
                    cursor += step.getOnDurationSec();
                    if (step.getOffDurationSec() != null) {
                        cursor += step.getOffDurationSec();
                    }
                }
                continue;
            }
            if (step.getDurationSec() != null) {
                cursor += step.getDurationSec();
            }
        }
        if (targetSeconds == 0) {
            return null;
        }
        return compliancePercent(matchedSeconds, targetSeconds);
    }

    private Double calculateTemplateCompliance(WorkoutTemplate template, Activity activity, short ftpWatts) {
        if (!activity.hasPowerData() || template.getSteps() == null || template.getSteps().isEmpty()) {
            return null;
        }

        int cursor = 0;
        int targetSeconds = 0;
        double matchedSeconds = 0.0;
        for (WorkoutStep step : template.getSteps()) {
            if (step.getRepeat() != null && step.getOnDurationSec() != null) {
                int repeats = Math.max(1, step.getRepeat());
                for (int index = 0; index < repeats; index++) {
                    targetSeconds += step.getOnDurationSec();
                    matchedSeconds += matchingSeconds(activity.getPowerStream(), cursor, step.getOnDurationSec(),
                            ftpWatts, step.getOnPowerPctFtpLow(), step.getOnPowerPctFtpHigh());
                    cursor += step.getOnDurationSec();
                    if (step.getOffDurationSec() != null) {
                        targetSeconds += step.getOffDurationSec();
                        matchedSeconds += matchingSeconds(activity.getPowerStream(), cursor, step.getOffDurationSec(),
                                ftpWatts, step.getOffPowerPctFtpLow(), step.getOffPowerPctFtpHigh());
                        cursor += step.getOffDurationSec();
                    }
                }
                continue;
            }
            if (step.getDurationSec() != null) {
                targetSeconds += step.getDurationSec();
                matchedSeconds += matchingSeconds(activity.getPowerStream(), cursor, step.getDurationSec(),
                        ftpWatts, step.getPowerPctFtpLow(), step.getPowerPctFtpHigh());
                cursor += step.getDurationSec();
            }
        }
        if (targetSeconds == 0) {
            return null;
        }
        return compliancePercent(matchedSeconds, targetSeconds);
    }

    private Double calculatePlannedTypeZoneCompliance(String plannedType, Activity activity, short ftpWatts) {
        if (!activity.hasPowerData() || plannedType == null) {
            return null;
        }
        TargetZone targetZone = plannedTypeZone(plannedType);
        return matchingSeconds(activity.getPowerStream(), 0, activity.getPowerStream().length,
                ftpWatts, targetZone.lowPct(), targetZone.highPct()) == 0
                ? 0.0
                : compliancePercent(
                matchingSeconds(activity.getPowerStream(), 0, activity.getPowerStream().length,
                        ftpWatts, targetZone.lowPct(), targetZone.highPct()),
                activity.getPowerStream().length);
    }

    private TargetZone plannedTypeZone(String plannedType) {
        return switch (plannedType) {
            case "RECOVERY" -> new TargetZone(45, 60);
            case "ENDURANCE" -> new TargetZone(60, 75);
            case "TEMPO" -> new TargetZone(76, 90);
            case "SWEET_SPOT" -> new TargetZone(88, 95);
            case "THRESHOLD" -> new TargetZone(95, 105);
            case "VO2MAX" -> new TargetZone(106, 120);
            case "ANAEROBIC" -> new TargetZone(121, 150);
            case "SPRINT" -> new TargetZone(151, 220);
            default -> new TargetZone(55, 95);
        };
    }

    private double matchingSeconds(
            int[] powerStream,
            int start,
            int durationSec,
            short ftpWatts,
            Integer lowPct,
            Integer highPct) {
        if (powerStream == null || powerStream.length == 0 || durationSec <= 0) {
            return 0.0;
        }
        if (lowPct == null && highPct == null) {
            return durationSec;
        }
        int safeStart = Math.max(0, start);
        int end = Math.min(powerStream.length, safeStart + durationSec);
        if (safeStart >= end) {
            return 0.0;
        }
        double lower = lowPct != null ? ftpWatts * (lowPct / 100.0) : Double.NEGATIVE_INFINITY;
        double upper = highPct != null ? ftpWatts * (highPct / 100.0) : Double.POSITIVE_INFINITY;
        int matched = 0;
        for (int index = safeStart; index < end; index++) {
            if (powerStream[index] >= lower && powerStream[index] <= upper) {
                matched++;
            }
        }
        return matched;
    }

    private Double compliancePercent(double matched, int targetSeconds) {
        if (targetSeconds <= 0) {
            return null;
        }
        return BigDecimal.valueOf(matched)
                .divide(BigDecimal.valueOf(targetSeconds), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private String determinePrimaryLimiter(
            Double tssCompliance,
            Double durationCompliance,
            Double intervalCompliance,
            Double zoneCompliance) {
        if ((intervalCompliance != null && intervalCompliance >= 85.0)
                && (zoneCompliance == null || zoneCompliance >= 85.0)
                && (tssCompliance == null || tssCompliance >= 90.0)
                && (durationCompliance == null || durationCompliance >= 90.0)) {
            return "ON_TARGET";
        }
        if (intervalCompliance != null && intervalCompliance < 80.0) {
            return "INTERVAL_QUALITY";
        }
        if (zoneCompliance != null && zoneCompliance < 80.0) {
            return "PACE_CONTROL";
        }
        if (durationCompliance != null && durationCompliance < 90.0) {
            return "VOLUME_SHORTFALL";
        }
        if (tssCompliance != null && tssCompliance < 90.0) {
            return "LOAD_SHORTFALL";
        }
        if (tssCompliance != null && tssCompliance > 115.0) {
            return "TOO_HARD";
        }
        return "GENERAL_EXECUTION";
    }

    private String determineNextDayAdvice(
            String limiter,
            Double tssCompliance,
            Double durationCompliance,
            Double intervalCompliance,
            Double zoneCompliance) {
        return switch (limiter) {
            case "ON_TARGET" -> "Bodziec trafił. Możesz trzymać kolejny planowany krok bez dodatkowej korekty.";
            case "INTERVAL_QUALITY" -> "Jutro zostaw spokojny tlen lub recovery, a kolejny akcent rób dopiero na świeższej nodze.";
            case "PACE_CONTROL" -> "Kolejny dzień trzymaj spokojniej i dopilnuj równego tempa, zanim wrócisz do mocnego bodźca.";
            case "VOLUME_SHORTFALL", "LOAD_SHORTFALL" -> "Nie dokręcaj jutro na siłę. Lepiej obroń następny jakościowy trening niż nadrabiać objętość dzień po dniu.";
            case "TOO_HARD" -> "Jutro idź w lekki dzień i pilnuj regeneracji, bo ten trening już mocno podbił koszt tygodnia.";
            default -> {
                if ((intervalCompliance != null && intervalCompliance < 75.0)
                        || (zoneCompliance != null && zoneCompliance < 75.0)
                        || (tssCompliance != null && tssCompliance > 120.0)
                        || (durationCompliance != null && durationCompliance > 125.0)) {
                    yield "Jutro potraktuj jako dzień ochrony jakości: lekki tlen albo recovery.";
                }
                yield "Jutro możesz iść zgodnie z planem, ale bez dokładania dodatkowej intensywności.";
            }
        };
    }

    private int scoreFromCompliance(Double compliance, double onTargetTolerance, double maxTolerance) {
        if (compliance == null) {
            return 70;
        }
        double delta = Math.abs(100.0 - compliance);
        if (delta <= onTargetTolerance) {
            return 100;
        }
        if (delta >= maxTolerance) {
            return 40;
        }
        double progress = (delta - onTargetTolerance) / (maxTolerance - onTargetTolerance);
        return (int) Math.round(100 - (progress * 60));
    }

    private int resolvePlannedStimulus(String plannedType) {
        if (plannedType == null) {
            return STIMULUS_UNKNOWN;
        }
        return switch (plannedType) {
            case "RECOVERY", "ENDURANCE" -> STIMULUS_EASY;
            case "TEMPO", "SWEET_SPOT" -> STIMULUS_MODERATE;
            case "THRESHOLD", "VO2MAX", "ANAEROBIC", "SPRINT" -> STIMULUS_HARD;
            default -> STIMULUS_UNKNOWN;
        };
    }

    private int resolveActualStimulus(CalendarActivitySummaryDto activity) {
        if (activity.getTss() == null || activity.getDurationMin() == null || activity.getDurationMin() <= 0) {
            return STIMULUS_UNKNOWN;
        }
        BigDecimal tssPerHour = activity.getTss()
                .multiply(BigDecimal.valueOf(60))
                .divide(BigDecimal.valueOf(activity.getDurationMin()), 2, RoundingMode.HALF_UP);
        if (tssPerHour.compareTo(BigDecimal.valueOf(45)) < 0) {
            return STIMULUS_EASY;
        }
        if (tssPerHour.compareTo(BigDecimal.valueOf(75)) < 0) {
            return STIMULUS_MODERATE;
        }
        return STIMULUS_HARD;
    }

    private ExecutionOutcome determineExecutionOutcome(
            Double tssCompliance,
            Double durationCompliance,
            int plannedStimulus,
            int actualStimulus,
            boolean stimulusMatch,
            int score) {
        double tss = tssCompliance != null ? tssCompliance : 100.0;
        double duration = durationCompliance != null ? durationCompliance : 100.0;

        if (!stimulusMatch && actualStimulus > plannedStimulus && (tss > 110.0 || duration < 95.0)) {
            return new ExecutionOutcome(
                    "TOO_HARD",
                    "Za mocno",
                    "Realizacja była cięższa niż zakładany bodziec i może niepotrzebnie podbić zmęczenie.");
        }
        if (!stimulusMatch && actualStimulus < plannedStimulus && (tss < 85.0 || duration < 90.0)) {
            return new ExecutionOutcome(
                    "MISSED_STIMULUS",
                    "Nietrafiony bodziec",
                    "Trening nie dowiózł jakości planowanej dla tej jednostki i warto skorygować kolejny akcent.");
        }
        if (tss >= 120.0 || duration >= 125.0) {
            return new ExecutionOutcome(
                    "TOO_HARD",
                    "Za mocno",
                    "Objętość albo obciążenie wyszły wyraźnie ponad plan.");
        }
        if (tss <= 70.0 && duration <= 80.0) {
            return new ExecutionOutcome(
                    "TOO_EASY",
                    "Za lekko",
                    "Jednostka była zbyt krótka i zbyt lekka, żeby w pełni zrealizować plan.");
        }
        if (stimulusMatch && score >= 85) {
            return new ExecutionOutcome(
                    "WELL_EXECUTED",
                    "Trafiony bodziec",
                    "Czas, obciążenie i charakter pracy były blisko założeń planu.");
        }
        return new ExecutionOutcome(
                "PARTIAL",
                "Częściowo trafiony",
                "Wykonanie było użyteczne, ale odbiegało od planu na tyle, że warto mieć to na uwadze przy kolejnych dniach.");
    }

    private List<TrainingGoalScorecardDto> buildGoalScorecards(
            TrainingPlanProgram program,
            List<TrainingPlan> plans,
            List<TrainingWeekObjectiveDto> weeklyObjectives) {
        OffsetDateTime from = program.getStartDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime to = program.getEndDate().plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to);
        Map<LocalDate, Activity> activitiesByDate = new LinkedHashMap<>();
        for (Activity activity : activities) {
            activitiesByDate.put(activity.getStartedAt().toLocalDate(), activity);
        }
        List<UUID> activityIds = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tssByActivity = activityIds.isEmpty()
                ? Map.of()
                : activityMetricRepository.findNumericValues(activityIds, "tss");

        Map<LocalDate, List<TrainingPlan>> plansByWeek = new LinkedHashMap<>();
        for (TrainingPlan plan : plans) {
            LocalDate weekStart = plan.getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            plansByWeek.computeIfAbsent(weekStart, ignored -> new ArrayList<>()).add(plan);
        }

        return weeklyObjectives.stream()
                .map(objective -> buildGoalScorecard(
                        objective,
                        plansByWeek.getOrDefault(objective.getWeekStart(), List.of()),
                        activitiesByDate,
                        tssByActivity))
                .toList();
    }

    private TrainingGoalScorecardDto buildGoalScorecard(
            TrainingWeekObjectiveDto objective,
            List<TrainingPlan> weekPlans,
            Map<LocalDate, Activity> activitiesByDate,
            Map<UUID, BigDecimal> tssByActivity) {
        TrainingSessionRole goalFocusRole = resolveGoalFocusRole(objective);
        BigDecimal actualTss = BigDecimal.ZERO;
        int plannedQualityDays = 0;
        int completedQualityDays = 0;
        int scoreSum = 0;
        int scoredDays = 0;
        int plannedGoalSessions = 0;
        int completedGoalSessions = 0;
        int goalScoreSum = 0;
        int goalScoredDays = 0;

        for (TrainingPlan plan : weekPlans) {
            TrainingSessionRole sessionRole = resolveTrainingRole(plan);
            if (plan.getPlannedType() != null && isHardCategory(plan.getPlannedType())) {
                plannedQualityDays++;
            }
            if (TrainingSessionRoleResolver.matchesGoalFocus(goalFocusRole, sessionRole)) {
                plannedGoalSessions++;
            }

            Activity activity = activitiesByDate.get(plan.getDate());
            if (activity == null) {
                continue;
            }
            BigDecimal tss = tssByActivity.get(activity.getId());
            if (tss != null) {
                actualTss = actualTss.add(tss);
            }
            CalendarActivitySummaryDto activityDto = CalendarActivitySummaryDto.builder()
                    .id(activity.getId())
                    .name(activity.getName())
                    .sportType(activity.getSportType())
                    .durationMin(activity.getMovingTimeSec() != null ? activity.getMovingTimeSec() / 60 : null)
                    .distanceKm(activity.getDistanceM() != null
                            ? activity.getDistanceM().divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP)
                            : null)
                    .tss(tss)
                    .build();
            Double tssCompliance = null;
            if (plan.getPlannedTss() != null && tss != null && plan.getPlannedTss().compareTo(BigDecimal.ZERO) > 0) {
                tssCompliance = tss.divide(plan.getPlannedTss(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }
            TrainingExecutionAssessmentDto execution = assessExecution(plan, activity, activityDto, tssCompliance);
            if (execution != null) {
                scoreSum += execution.getScore();
                scoredDays++;
                if (TrainingSessionRoleResolver.matchesGoalFocus(goalFocusRole, sessionRole)) {
                    goalScoreSum += execution.getScore();
                    goalScoredDays++;
                    if (countsAsGoalStimulus(execution)) {
                        completedGoalSessions++;
                    }
                }
                if (plan.getPlannedType() != null
                        && isHardCategory(plan.getPlannedType())
                        && !"MISSED_STIMULUS".equals(execution.getOutcome())
                        && !"TOO_EASY".equals(execution.getOutcome())) {
                    completedQualityDays++;
                }
            }
        }

        BigDecimal plannedTss = objective.getPlannedTss() != null ? objective.getPlannedTss() : BigDecimal.ZERO;
        Integer goalExecutionScore = calculateGoalExecutionScore(
                plannedGoalSessions, completedGoalSessions, goalScoreSum, goalScoredDays);
        String goalExecutionStatus = determineGoalExecutionStatus(
                plannedGoalSessions, completedGoalSessions, goalExecutionScore);
        return TrainingGoalScorecardDto.builder()
                .weekStart(objective.getWeekStart())
                .weekEnd(objective.getWeekEnd())
                .label(objective.getLabel())
                .plannedTss(plannedTss)
                .actualTss(actualTss)
                .plannedQualityDays(plannedQualityDays)
                .completedQualityDays(completedQualityDays)
                .goalFocusLabel(objective.getLabel())
                .goalFocusRole(goalFocusRole.name())
                .plannedGoalSessions(plannedGoalSessions)
                .completedGoalSessions(completedGoalSessions)
                .goalExecutionScore(goalExecutionScore)
                .goalExecutionStatus(goalExecutionStatus)
                .avgExecutionScore(scoredDays > 0 ? Math.round((float) scoreSum / scoredDays) : null)
                .onTrack(isScorecardOnTrack(plannedTss, actualTss, plannedQualityDays, completedQualityDays)
                        && isGoalExecutionOnTrack(goalExecutionStatus))
                .build();
    }

    private TrainingSessionRole resolveGoalFocusRole(TrainingWeekObjectiveDto objective) {
        return TrainingSessionRoleResolver.fromObjectiveType(objective.getObjectiveType());
    }

    private boolean countsAsGoalStimulus(TrainingExecutionAssessmentDto execution) {
        return !"MISSED_STIMULUS".equals(execution.getOutcome())
                && !"TOO_EASY".equals(execution.getOutcome())
                && execution.getScore() >= 70;
    }

    private Integer calculateGoalExecutionScore(
            int plannedGoalSessions,
            int completedGoalSessions,
            int goalScoreSum,
            int goalScoredDays) {
        if (plannedGoalSessions == 0 && goalScoredDays == 0) {
            return 100;
        }
        double completionScore = plannedGoalSessions == 0
                ? 100
                : (completedGoalSessions * 100.0) / plannedGoalSessions;
        double executionScore = goalScoredDays == 0 ? 0 : (double) goalScoreSum / goalScoredDays;
        return (int) Math.round((completionScore * 0.65) + (executionScore * 0.35));
    }

    private String determineGoalExecutionStatus(
            int plannedGoalSessions,
            int completedGoalSessions,
            Integer goalExecutionScore) {
        if (plannedGoalSessions == 0) {
            return "STABLE";
        }
        if (completedGoalSessions >= plannedGoalSessions && goalExecutionScore != null && goalExecutionScore >= 75) {
            return "ON_TARGET";
        }
        if (completedGoalSessions > 0) {
            return "PARTIAL";
        }
        return "MISSED";
    }

    private boolean isGoalExecutionOnTrack(String goalExecutionStatus) {
        return !"MISSED".equals(goalExecutionStatus);
    }

    private boolean isScorecardOnTrack(
            BigDecimal plannedTss,
            BigDecimal actualTss,
            int plannedQualityDays,
            int completedQualityDays) {
        if (plannedTss.compareTo(BigDecimal.ZERO) <= 0) {
            return completedQualityDays >= plannedQualityDays;
        }
        BigDecimal lowerBound = plannedTss.multiply(BigDecimal.valueOf(0.85));
        BigDecimal upperBound = plannedTss.multiply(BigDecimal.valueOf(1.15));
        boolean tssOnTrack = actualTss.compareTo(lowerBound) >= 0 && actualTss.compareTo(upperBound) <= 0;
        boolean qualityOnTrack = plannedQualityDays == 0 || completedQualityDays >= plannedQualityDays;
        return tssOnTrack && qualityOnTrack;
    }

    private boolean isHardCategory(String plannedType) {
        try {
            return HARD_CATEGORIES.contains(WorkoutCategory.valueOf(plannedType));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private TrainingPlanProgramDto mapProgramDto(
            TrainingPlanProgram program,
            List<TrainingWeekObjectiveDto> weeklyObjectives,
            List<TrainingGoalScorecardDto> goalScorecards) {
        TrainingPlanProgramDto base = TrainingPlanProgramDto.fromDomain(program);
        return new TrainingPlanProgramDto(
                base.getId(),
                base.getName(),
                base.getGoal(),
                base.getGoalPriority(),
                base.getStartDate(),
                base.getEndDate(),
                base.getEventDate(),
                base.getTaperStartDate(),
                weeklyObjectives,
                goalScorecards,
                base.getTargetWeeklyTss(),
                base.getTargetWeeklyHours(),
                base.getWeekdayAvailabilityMinutes(),
                base.getWeekendAvailabilityMinutes(),
                base.getPreferredLongRideDay(),
                base.getEnvironmentPreference(),
                base.getGeneratedBy(),
                base.getCreatedAt()
        );
    }

    private int resolveWeekdayAvailabilityMinutes(GeneratePlanRequest request) {
        return request.getWeekdayAvailabilityMinutes() != null
                ? request.getWeekdayAvailabilityMinutes()
                : DEFAULT_WEEKDAY_AVAILABILITY_MINUTES;
    }

    private int resolveWeekendAvailabilityMinutes(GeneratePlanRequest request) {
        return request.getWeekendAvailabilityMinutes() != null
                ? request.getWeekendAvailabilityMinutes()
                : DEFAULT_WEEKEND_AVAILABILITY_MINUTES;
    }

    private DayOfWeek resolvePreferredLongRideDay(GeneratePlanRequest request) {
        if (request.getPreferredLongRideDay() == null || request.getPreferredLongRideDay().isBlank()) {
            return DayOfWeek.SATURDAY;
        }
        return DayOfWeek.valueOf(request.getPreferredLongRideDay());
    }

    private String resolveEnvironmentPreference(GeneratePlanRequest request) {
        if (request.getEnvironmentPreference() == null || request.getEnvironmentPreference().isBlank()) {
            return DEFAULT_ENVIRONMENT_PREFERENCE;
        }
        return request.getEnvironmentPreference();
    }

    private boolean isWeekend(DayOfWeek day) {
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private List<TrainingWeekObjectiveDto> buildWeeklyObjectives(TrainingPlanProgram program, List<TrainingPlan> plans) {
        if (program == null) {
            return List.of();
        }
        Map<LocalDate, List<TrainingPlan>> plansByWeek = new LinkedHashMap<>();
        for (TrainingPlan plan : plans) {
            LocalDate weekStart = plan.getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            plansByWeek.computeIfAbsent(weekStart, ignored -> new ArrayList<>()).add(plan);
        }

        int totalWeeks = (int) ChronoUnit.WEEKS.between(program.getStartDate(), program.getEndDate().plusDays(1));
        List<TrainingWeekObjectiveDto> objectives = new ArrayList<>();
        int weekIndex = 0;
        for (LocalDate weekStart = program.getStartDate(); !weekStart.isAfter(program.getEndDate()); weekStart = weekStart.plusWeeks(1)) {
            WeekObjective objective = determineWeekObjective(program.getGoal(), weekIndex, Math.max(totalWeeks, 1));
            List<TrainingPlan> weekPlans = plansByWeek.getOrDefault(weekStart, List.of());
            BigDecimal plannedTss = weekPlans.stream()
                    .map(TrainingPlan::getPlannedTss)
                    .filter(tss -> tss != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            objectives.add(toWeeklyObjectiveDto(weekStart, objective, plannedTss, weekPlans));
            weekIndex++;
        }
        return objectives;
    }

    private TrainingWeekObjectiveDto toWeeklyObjectiveDto(
            LocalDate weekStart,
            WeekObjective objective,
            BigDecimal plannedTss,
            List<TrainingPlan> weekPlans) {
        WeeklyFuelingAdvice fuelingAdvice = determineWeeklyFuelingAdvice(objective, plannedTss);
        return new TrainingWeekObjectiveDto(
                weekStart,
                weekStart.plusDays(6),
                objective.type(),
                objective.label(),
                objective.focus(),
                plannedTss,
                objective.maxQualityDays(),
                weekPlans.stream()
                        .map(TrainingPlan::getPlannedType)
                        .filter(type -> type != null)
                        .distinct()
                        .toList(),
                fuelingAdvice.label(),
                fuelingAdvice.guidance()
        );
    }

    private WeeklyFuelingAdvice determineWeeklyFuelingAdvice(WeekObjective objective, BigDecimal plannedTss) {
        if (objective.recoveryLike() || objective.taperLike()) {
            return new WeeklyFuelingAdvice(
                    "Bez zbędnego ładowania",
                    "Najwyższy dowóz zostaw tylko pod jedyny mocniejszy dzień, a lekkie dni trzymaj normalnie bez dokładania nadmiaru węgli.");
        }
        if (objective.type().contains("VO2") || objective.type().contains("THRESHOLD") || objective.type().contains("SHARPEN")) {
            return new WeeklyFuelingAdvice(
                    "Węgle pod akcent",
                    "Najwięcej węgli zaplanuj przed i po dniach jakościowych; obok nich trzymaj spokojniejsze dni bez ładowania na zapas.");
        }
        if (objective.type().contains("BASE") || plannedTss.compareTo(BigDecimal.valueOf(360)) >= 0) {
            return new WeeklyFuelingAdvice(
                    "Dowóz na długi tlen",
                    "Najwięcej węgli zaplanuj pod długi tlen i jedyny akcent tygodnia; lekkie dni bez dodatkowego ładowania.");
        }
        return new WeeklyFuelingAdvice(
                "Równo pod główne dni",
                "Dowóz węgli ustaw pod dwa najważniejsze treningi tygodnia, a resztę dni trzymaj na zwykłym poziomie regeneracyjnym.");
    }

    private WeekObjective determineWeekObjective(ProgramGoal goal, int weekIndex, int totalWeeks) {
        if (goal == ProgramGoal.RECOVERY_BLOCK) {
            return new WeekObjective(
                    "RECOVERY",
                    "Regeneracja",
                    "W tygodniu priorytetem jest odbudowa świeżości i lekka objętość.",
                    RECOVERY_CATEGORIES,
                    0,
                    true,
                    false);
        }
        if (goal == ProgramGoal.TAPER) {
            return new WeekObjective(
                    "TAPER",
                    "Taper i świeżość",
                    "Zmniejsz objętość, zostaw krótki akcent i pilnuj świeżości na start.",
                    EnumSet.of(WorkoutCategory.ENDURANCE, WorkoutCategory.THRESHOLD, WorkoutCategory.RECOVERY),
                    1,
                    false,
                    true);
        }
        if (goal == ProgramGoal.MAINTAIN_FITNESS) {
            return new WeekObjective(
                    "MAINTAIN",
                    "Utrzymanie formy",
                    "Jeden jakościowy bodziec i solidny tlen bez rozkręcania zmęczenia.",
                    EnumSet.of(WorkoutCategory.TEMPO, WorkoutCategory.THRESHOLD, WorkoutCategory.ENDURANCE),
                    1,
                    false,
                    false);
        }
        if (weekIndex % 4 == 3) {
            return new WeekObjective(
                    "RECOVERY",
                    "Tydzień regeneracyjny",
                    "Zdejmij obciążenie i zostaw tylko lekki lub umiarkowany bodziec.",
                    RECOVERY_CATEGORIES,
                    0,
                    true,
                    false);
        }
        if (goal == ProgramGoal.BUILD_BASE) {
            return switch (weekIndex % 3) {
                case 1 -> new WeekObjective(
                        "BASE_TEMPO",
                        "Budowa tempa",
                        "Priorytetem jest stabilna praca tlenowa i umiarkowane tempo bez przeładowania jakością.",
                        TEMPO_BLOCK_CATEGORIES,
                        1,
                        false,
                        false);
                default -> new WeekObjective(
                        "BASE_ENDURANCE",
                        "Budowa bazy",
                        "Zbieraj objętość i długi tlen, a akcent trzymaj pod kontrolą.",
                        EnumSet.of(WorkoutCategory.ENDURANCE, WorkoutCategory.TEMPO, WorkoutCategory.RECOVERY),
                        1,
                        false,
                        false);
            };
        }
        if (goal == ProgramGoal.BUILD_PEAK) {
            if (weekIndex >= Math.max(1, totalWeeks - 1)) {
                return new WeekObjective(
                        "SHARPEN",
                        "Szlif formy",
                        "Zostaw 1-2 jakościowe bodźce, ale nie dokładuj zbędnej objętości.",
                        EnumSet.of(WorkoutCategory.THRESHOLD, WorkoutCategory.VO2MAX, WorkoutCategory.ENDURANCE),
                        2,
                        false,
                        false);
            }
            return switch (weekIndex % 2) {
                case 1 -> new WeekObjective(
                        "BUILD_VO2",
                        "Budowa VO2",
                        "Tydzień z naciskiem na VO2 i podtrzymaniem tlenu pomiędzy akcentami.",
                        VO2_BLOCK_CATEGORIES,
                        2,
                        false,
                        false);
                default -> new WeekObjective(
                        "BUILD_THRESHOLD",
                        "Budowa progu",
                        "Najważniejszy jest kontrolowany próg lub sweet spot oraz spokojne dni wokół niego.",
                        THRESHOLD_BLOCK_CATEGORIES,
                        2,
                        false,
                        false);
            };
        }
        return new WeekObjective(
                "GENERAL_BUILD",
                "Rozwój ogólny",
                "Połącz tlen z jednym jakościowym bodźcem, bez skrajności.",
                EnumSet.of(WorkoutCategory.ENDURANCE, WorkoutCategory.TEMPO, WorkoutCategory.THRESHOLD),
                1,
                false,
                false);
    }

    private record WeekObjective(
            String type,
            String label,
            String focus,
            Set<WorkoutCategory> preferredCategories,
            int maxQualityDays,
            boolean recoveryLike,
            boolean taperLike) {
    }
}
