package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.CalendarActivitySummaryDto;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.CreateTrainingPlanRequest;
import pl.strava.analizator.application.dto.GeneratePlanRequest;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ProgramGoal;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanProgram;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
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

    // Mon=0%, Tue=15%, Wed=20%, Thu=0%, Fri=15%, Sat=30%, Sun=20%
    static final double[] DEFAULT_DAY_WEIGHTS = {0.0, 0.15, 0.20, 0.0, 0.15, 0.30, 0.20};
    static final short DEFAULT_FTP_WATTS = 200;

    private static final Set<WorkoutCategory> HARD_CATEGORIES = EnumSet.of(
            WorkoutCategory.THRESHOLD, WorkoutCategory.VO2MAX, WorkoutCategory.ANAEROBIC);

    private static final Set<WorkoutCategory> EASY_CATEGORIES = EnumSet.of(
            WorkoutCategory.ENDURANCE, WorkoutCategory.TEMPO);

    private static final Set<WorkoutCategory> RECOVERY_CATEGORIES = EnumSet.of(
            WorkoutCategory.RECOVERY, WorkoutCategory.ENDURANCE);

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

    public List<CalendarDayDto> getCalendarView(LocalDate from, LocalDate to) {
        List<TrainingPlan> plans = trainingPlanRepository.findByDateRange(from, to);
        OffsetDateTime fromDateTime = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime toDateTime = to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(fromDateTime, toDateTime);

        Map<LocalDate, TrainingPlan> plansByDate = new LinkedHashMap<>();
        for (TrainingPlan plan : plans) {
            plansByDate.put(plan.getDate(), plan);
        }

        Map<LocalDate, Activity> activitiesByDate = new LinkedHashMap<>();
        for (Activity activity : activities) {
            LocalDate actDate = activity.getStartedAt().toLocalDate();
            activitiesByDate.put(actDate, activity);
        }

        List<UUID> activityIds = activities.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> tssValues = activityIds.isEmpty()
                ? Map.of()
                : activityMetricRepository.findNumericValues(activityIds, "tss");

        Map<LocalDate, CalendarDayDto> result = new LinkedHashMap<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            TrainingPlan plan = plansByDate.get(date);
            Activity activity = activitiesByDate.get(date);

            TrainingPlanDto planDto = plan != null ? toDto(plan) : null;
            CalendarActivitySummaryDto activityDto = null;
            Double compliance = null;

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
            }

            result.put(date, CalendarDayDto.builder()
                    .date(date)
                    .planned(planDto)
                    .actual(activityDto)
                    .compliance(compliance)
                    .build());
        }

        return new ArrayList<>(result.values());
    }

    public List<TrainingPlanProgramDto> getPrograms() {
        return programRepository.findAll().stream()
                .map(TrainingPlanProgramDto::fromDomain)
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

        TrainingPlanProgram program = TrainingPlanProgram.builder()
                .name(request.getGoal() + " " + request.getWeeks() + "w")
                .goal(ProgramGoal.valueOf(request.getGoal()))
                .startDate(startDate)
                .endDate(endDate)
                .targetWeeklyTss(request.getTargetWeeklyTss())
                .generatedBy("auto")
                .build();
        TrainingPlanProgram savedProgram = programRepository.save(program);

        short ftp = athleteProfileRepository.findFirst()
                .filter(p -> p.hasFtp())
                .map(p -> p.getFtpWatts())
                .orElse(DEFAULT_FTP_WATTS);

        List<WorkoutTemplate> allTemplates = workoutTemplateRepository.findAll();
        List<DayOfWeek> trainingDays = pickTrainingDays(request.getTrainingDaysPerWeek());

        WorkoutTemplate previousTemplate = null;
        for (int week = 0; week < request.getWeeks(); week++) {
            LocalDate weekStart = startDate.plusWeeks(week);

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

            double[] weights = computeDayWeights(trainingDays);
            double totalWeight = 0;
            for (double w : weights) totalWeight += w;

            for (DayOfWeek day : trainingDays) {
                LocalDate planDate = weekStart.with(day);
                if (planDate.isBefore(startDate) || planDate.isAfter(endDate)) continue;

                double dayWeight = weights[day.getValue() - 1];
                BigDecimal dayTss = weeklyTss.multiply(BigDecimal.valueOf(dayWeight / totalWeight))
                        .setScale(2, RoundingMode.HALF_UP);

                boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
                boolean afterHardDay = previousTemplate != null
                        && HARD_CATEGORIES.contains(previousTemplate.getCategory());

                WorkoutTemplate bestTemplate = selectTemplate(
                        allTemplates, dayTss, previousTemplate, isWeekend, afterHardDay, isRecoveryWeek);

                Integer powerLow = null;
                Integer powerHigh = null;
                String plannedType = null;
                String description = null;
                Integer durationMin = null;

                if (bestTemplate != null) {
                    plannedType = bestTemplate.getCategory().name();
                    description = bestTemplate.getName();
                    durationMin = bestTemplate.getTargetDurationMin();
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
                previousTemplate = bestTemplate;
            }
        }

        return TrainingPlanProgramDto.fromDomain(savedProgram);
    }

    private TrainingPlanDto toDto(TrainingPlan plan) {
        String templateName = null;
        if (plan.getWorkoutTemplateId() != null) {
            templateName = workoutTemplateRepository.findById(plan.getWorkoutTemplateId())
                    .map(WorkoutTemplate::getName)
                    .orElse(null);
        }
        return TrainingPlanDto.fromDomain(plan, templateName);
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
        double[] weights = new double[7];
        for (DayOfWeek day : trainingDays) {
            weights[day.getValue() - 1] = DEFAULT_DAY_WEIGHTS[day.getValue() - 1];
            if (weights[day.getValue() - 1] == 0.0) {
                weights[day.getValue() - 1] = 0.15;
            }
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
            WorkoutTemplate previousTemplate, boolean isWeekend, boolean afterHardDay, boolean isRecoveryWeek) {
        if (templates.isEmpty() || targetTss == null) return null;

        List<WorkoutTemplate> candidates = templates.stream()
                .filter(t -> t.getTargetTss() != null)
                .toList();
        if (candidates.isEmpty()) return null;

        // Avoid same template two days in a row
        if (previousTemplate != null) {
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

        // Weekend: prefer "Long Ride" ENDURANCE template
        if (isWeekend) {
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
            if (!easyOnly.isEmpty()) candidates = easyOnly;
        }

        return candidates.stream()
                .min(Comparator.comparing(t -> t.getTargetTss().subtract(targetTss).abs()))
                .orElse(null);
    }
}
