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
import pl.strava.analizator.application.dto.CalendarSessionDto;
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
import pl.strava.analizator.domain.model.AthleteProfile;
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

    private final java.time.Clock clock;

    private final TrainingPlanRepository trainingPlanRepository;
    private final pl.strava.analizator.domain.port.WorkoutExecutionRepository executionRepository;
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
        WorkoutTemplate template = null;

        if (request.getWorkoutTemplateId() != null) {
            template = workoutTemplateRepository.findById(request.getWorkoutTemplateId())
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

        AthleteProfile thresholds = athleteProfileRepository.findFirst().orElse(null);
        List<WorkoutStep> snapshotSteps = request.getScaledSteps() != null
                ? request.getScaledSteps().stream().map(pl.strava.analizator.application.dto.WorkoutStepInputDto::toDomain).toList()
                : template != null && template.getSteps() != null
                        ? List.copyOf(new ArrayList<>(template.getSteps())) : List.of();

        TrainingPlan plan = TrainingPlan.builder()
                .date(request.getDate())
                .plannedType(plannedType)
                .plannedTss(plannedTss)
                .plannedDurationMin(plannedDurationMin)
                .plannedDescription(plannedDescription)
                .programId(request.getProgramId())
                .workoutTemplateId(request.getWorkoutTemplateId())
                .workoutTemplateRevisionId(template != null ? template.getRevisionId() : null)
                .workoutTemplateRevision(template != null ? template.getRevision() : null)
                .workoutNameSnapshot(template != null ? template.getName() : plannedDescription)
                .workoutStepsSnapshot(snapshotSteps)
                .ftpWatts(thresholds != null && thresholds.getFtpWatts() != null
                        ? thresholds.getFtpWatts().intValue() : null)
                .lthrBpm(thresholds != null && thresholds.getLthrBpm() != null
                        ? thresholds.getLthrBpm().intValue() : null)
                .maxHrBpm(thresholds != null && thresholds.getMaxHrBpm() != null
                        ? thresholds.getMaxHrBpm().intValue() : null)
                .restingHrBpm(thresholds != null && thresholds.getRestingHrBpm() != null
                        ? thresholds.getRestingHrBpm().intValue() : null)
                .deliveryMethod("ON_DEVICE")
                .deliveryStatus("READY")
                .activityMatchStatus("UNMATCHED")
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
        List<Activity> activities = activityRepository.findByStartedAtBetween(
                from.atStartOfDay(clock.getZone()).toOffsetDateTime(),
                to.plusDays(1).atStartOfDay(clock.getZone()).toOffsetDateTime());
        CoachMemorySummaryDto coachMemory = getCoachMemory();
        Map<LocalDate, List<TrainingPlan>> plansByDate = plans.stream()
                .collect(Collectors.groupingBy(TrainingPlan::getDate, LinkedHashMap::new, Collectors.toList()));
        Map<LocalDate, List<Activity>> activitiesByDate = activities.stream()
                .collect(Collectors.groupingBy(a -> a.getStartedAt().atZoneSameInstant(clock.getZone()).toLocalDate()));
        Map<LocalDate, ProjectionContext> projections = buildProjections(from, to, plans, coachMemory);
        List<UUID> ids = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tss = new ActivityLoadService(activityMetricRepository).getLoads(activities);
        List<CalendarDayDto> result = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            List<TrainingPlan> dailyPlans = plansByDate.getOrDefault(date, List.of());
            List<Activity> dailyActivities = activitiesByDate.getOrDefault(date, List.of());
            List<CalendarSessionDto> sessions = new ArrayList<>();
            for (TrainingPlan plan : dailyPlans) {
                // A date alone cannot match one recording to several scheduled sessions.
                Activity actual = plan.getActualActivityId() != null || dailyPlans.size() == 1
                        ? resolveCalendarActivity(plan, dailyActivities) : null;
                CalendarActivitySummaryDto summary = actual != null ? calendarSummary(actual, tss.get(actual.getId())) : null;
                Double ratio = summary != null && summary.getTss() != null && plan.getPlannedTss() != null
                        && plan.getPlannedTss().signum() > 0
                        ? summary.getTss().divide(plan.getPlannedTss(), 4, RoundingMode.HALF_UP).doubleValue() * 100 : null;
                // Reading the calendar must not replace an immutable scheduled snapshot.
                sessions.add(CalendarSessionDto.builder().planned(toDto(plan)).actual(summary).compliance(ratio)
                        .execution(assessExecution(plan, actual, summary, ratio)).build());
            }
            CalendarSessionDto first = sessions.isEmpty() ? null : sessions.getFirst();
            ProjectionContext projection = projections.get(date);
            CalendarActivitySummaryDto single = dailyActivities.size() == 1
                    ? calendarSummary(dailyActivities.getFirst(), tss.get(dailyActivities.getFirst().getId())) : null;
            result.add(CalendarDayDto.builder().date(date).sessions(sessions)
                    .activities(dailyActivities.stream().map(a -> calendarSummary(a, tss.get(a.getId()))).toList())
                    .planned(first != null ? first.getPlanned() : null)
                    .actual(first != null ? first.getActual() : single)
                    .compliance(first != null ? first.getCompliance() : null)
                    .execution(first != null ? first.getExecution() : null)
                    .projection(projection != null ? projection.projection() : null)
                    .adjustment(projection != null ? projection.adjustment() : null).build());
        }
        return result;
    }

    private CalendarActivitySummaryDto calendarSummary(Activity activity, BigDecimal tss) {
        return CalendarActivitySummaryDto.builder().id(activity.getId()).name(activity.getName()).sportType(activity.getSportType())
                .durationMin(activity.getMovingTimeSec() != null ? activity.getMovingTimeSec() / 60 : null)
                .distanceKm(activity.getDistanceM() != null ? activity.getDistanceM().divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP) : null)
                .tss(tss).build();
    }

    private Activity resolveCalendarActivity(TrainingPlan plan, List<Activity> candidates) {
        if (plan != null && plan.getActualActivityId() != null) {
            return candidates.stream()
                    .filter(activity -> plan.getActualActivityId().equals(activity.getId()))
                    .findFirst().orElse(null);
        }
        return candidates.size() == 1 ? candidates.getFirst() : null;
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

        AthleteProfile planningProfile = athleteProfileRepository.findFirst().orElse(null);
        short ftp = Optional.ofNullable(planningProfile)
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
                        .workoutTemplateRevisionId(bestTemplate != null ? bestTemplate.getRevisionId() : null)
                        .workoutTemplateRevision(bestTemplate != null ? bestTemplate.getRevision() : null)
                        .workoutNameSnapshot(bestTemplate != null ? bestTemplate.getName() : description)
                        .workoutStepsSnapshot(bestTemplate != null && bestTemplate.getSteps() != null
                                ? List.copyOf(bestTemplate.getSteps()) : List.of())
                        .ftpWatts((int) ftp)
                        .lthrBpm(planningProfile != null && planningProfile.getLthrBpm() != null
                                ? planningProfile.getLthrBpm().intValue() : null)
                        .maxHrBpm(planningProfile != null && planningProfile.getMaxHrBpm() != null
                                ? planningProfile.getMaxHrBpm().intValue() : null)
                        .restingHrBpm(planningProfile != null && planningProfile.getRestingHrBpm() != null
                                ? planningProfile.getRestingHrBpm().intValue() : null)
                        .deliveryMethod("ON_DEVICE")
                        .deliveryStatus("READY")
                        .activityMatchStatus("UNMATCHED")
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
        String templateName = plan.getWorkoutNameSnapshot();
        if (templateName == null && plan.getWorkoutTemplateId() != null) {
            templateName = workoutTemplateRepository.findById(plan.getWorkoutTemplateId())
                    .map(WorkoutTemplate::getName)
                    .orElse(null);
        }
        return TrainingPlanDto.fromDomain(plan, templateName, resolveTrainingRole(plan).name());
    }

    private TrainingSessionRole resolveTrainingRole(TrainingPlan plan) {
        return TrainingSessionRoleResolver.fromPlan(plan);
    }

    private TrainingSessionRole resolveTrainingRole(WorkoutCategory category, Integer durationMin) {
        return TrainingSessionRoleResolver.fromCategory(category, durationMin);
    }

    private Map<LocalDate, ProjectionContext> buildProjections(
            LocalDate from,
            LocalDate to,
            List<TrainingPlan> displayedPlans,
            CoachMemorySummaryDto coachMemory) {
        LocalDate today = LocalDate.now(clock);
        if (!to.isAfter(today)) {
            return Map.of();
        }

        LocalDate projectionStart = today.plusDays(1);
        List<TrainingPlan> projectionPlans = from.isAfter(today)
                ? trainingPlanRepository.findByDateRange(today, to)
                : displayedPlans;

        Map<LocalDate, List<TrainingPlan>> planByDate = projectionPlans.stream().collect(Collectors.groupingBy(TrainingPlan::getDate));

        BigDecimal ctlValue = dailyMetricRepository.findNumericValue(today, "ctl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "ctl"))
                .orElse(null);
        BigDecimal atlValue = dailyMetricRepository.findNumericValue(today, "atl")
                .or(() -> dailyMetricRepository.findNumericValue(today.minusDays(1), "atl"))
                .orElse(null);
        if (ctlValue == null || atlValue == null) return Map.of();

        double ctl = ctlValue.doubleValue();
        double atl = atlValue.doubleValue();
        Map<UUID, TrainingPlanProgram> programs = new HashMap<>();
        TrainingPlan previousPlanned = null;
        Map<LocalDate, ProjectionContext> result = new LinkedHashMap<>();

        for (LocalDate date = projectionStart; !date.isAfter(to); date = date.plusDays(1)) {
            List<TrainingPlan> dailyPlans = planByDate.getOrDefault(date, List.of());
            TrainingPlan plan = dailyPlans.isEmpty() ? null : dailyPlans.getFirst();
            if (dailyPlans.stream().anyMatch(p -> p.getStatus() != TrainingPlanStatus.SKIPPED && p.getPlannedTss() == null)) break;
            double plannedTss = dailyPlans.stream().filter(p -> p.getStatus() != TrainingPlanStatus.SKIPPED)
                    .map(TrainingPlan::getPlannedTss).filter(java.util.Objects::nonNull).mapToDouble(BigDecimal::doubleValue).sum();
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

    private TrainingExecutionAssessmentDto assessExecution(TrainingPlan plan, Activity activity, CalendarActivitySummaryDto summary, Double tssCompliance) {
        var execution = plan != null ? executionRepository.findLatestByScheduledWorkoutId(plan.getId()).orElse(null) : null;
        return new TrainingExecutionAssessmentService().assess(plan, activity, summary, tssCompliance, execution);
    }

    private List<TrainingGoalScorecardDto> buildGoalScorecards(
            TrainingPlanProgram program,
            List<TrainingPlan> plans,
            List<TrainingWeekObjectiveDto> weeklyObjectives) {
        OffsetDateTime from = program.getStartDate().atStartOfDay(clock.getZone()).toOffsetDateTime();
        OffsetDateTime to = program.getEndDate().plusDays(1).atStartOfDay(clock.getZone()).toOffsetDateTime();
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to);
        Map<LocalDate, List<Activity>> activitiesByDate = new LinkedHashMap<>();
        for (Activity activity : activities) {
            activitiesByDate.computeIfAbsent(activity.getStartedAt().atZoneSameInstant(clock.getZone()).toLocalDate(), ignored -> new ArrayList<>()).add(activity);
        }
        List<UUID> activityIds = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tssByActivity = new ActivityLoadService(activityMetricRepository).getLoads(activities);

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
            Map<LocalDate, List<Activity>> activitiesByDate,
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

            boolean singlePlan = weekPlans.stream().filter(p -> p.getDate().equals(plan.getDate())).count() == 1;
            Activity activity = plan.getActualActivityId() != null || singlePlan
                    ? resolveCalendarActivity(plan, activitiesByDate.getOrDefault(plan.getDate(), List.of())) : null;
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
            if (execution != null && execution.getScore() != null) {
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
                && execution.getScore() != null && execution.getScore() >= 70;
    }

    private Integer calculateGoalExecutionScore(
            int plannedGoalSessions,
            int completedGoalSessions,
            int goalScoreSum,
            int goalScoredDays) {
        if (goalScoredDays == 0) return null;
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
        if (goalExecutionScore == null) return "UNKNOWN";
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
