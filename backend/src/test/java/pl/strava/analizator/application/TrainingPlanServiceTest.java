package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.CoachMemorySummaryDto;
import pl.strava.analizator.application.dto.CreateTrainingPlanRequest;
import pl.strava.analizator.application.dto.GeneratePlanRequest;
import pl.strava.analizator.application.dto.RecordAdjustmentFeedbackRequest;
import pl.strava.analizator.application.dto.TrainingGoalScorecardDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AdjustmentFeedbackDecision;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.GoalPriority;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.ProgramGoal;
import pl.strava.analizator.domain.model.TrainingAdjustmentFeedback;
import pl.strava.analizator.domain.model.TrainingDayEnvironment;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanProgram;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
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

@ExtendWith(MockitoExtension.class)
class TrainingPlanServiceTest {

    @Mock
    private TrainingPlanRepository trainingPlanRepository;
    @Mock
    private TrainingPlanProgramRepository programRepository;
    @Mock
    private WorkoutTemplateRepository workoutTemplateRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private ActivityMetricRepository activityMetricRepository;
    @Mock
    private AthleteProfileRepository athleteProfileRepository;
    @Mock
    private DailyMetricRepository dailyMetricRepository;
    @Mock
    private PlannedRouteRepository plannedRouteRepository;
    @Mock
    private TrainingDayEnvironmentPort trainingDayEnvironmentPort;
    @Mock
    private TrainingAdjustmentFeedbackRepository trainingAdjustmentFeedbackRepository;

    @InjectMocks
    private TrainingPlanService service;

    @Test
    void getPlans_returnsPlansInRange() {
        LocalDate from = LocalDate.of(2025, 1, 6);
        LocalDate to = LocalDate.of(2025, 1, 12);

        TrainingPlan plan1 = buildPlan(from, BigDecimal.valueOf(80));
        TrainingPlan plan2 = buildPlan(from.plusDays(2), BigDecimal.valueOf(100));
        when(trainingPlanRepository.findByDateRange(from, to)).thenReturn(List.of(plan1, plan2));

        List<TrainingPlanDto> result = service.getPlans(from, to);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(80));
        assertThat(result.get(1).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void getPlans_includesResolvedSessionRole() {
        LocalDate day = LocalDate.of(2025, 1, 6);
        TrainingPlan plan = buildPlan(day, BigDecimal.valueOf(90));
        when(trainingPlanRepository.findByDateRange(day, day)).thenReturn(List.of(plan));

        List<TrainingPlanDto> result = service.getPlans(day, day);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getSessionRole()).isEqualTo("ENDURANCE");
    }

    @Test
    void getPrograms_includesWeeklyObjectives() {
        UUID programId = UUID.randomUUID();
        TrainingPlanProgram program = TrainingPlanProgram.builder()
                .id(programId)
                .name("BUILD_BASE 2w")
                .goal(ProgramGoal.BUILD_BASE)
                .goalPriority(GoalPriority.B)
                .startDate(LocalDate.of(2025, 1, 6))
                .endDate(LocalDate.of(2025, 1, 19))
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .generatedBy("auto")
                .build();
        when(programRepository.findAll()).thenReturn(List.of(program));
        when(trainingPlanRepository.findByProgramId(programId)).thenReturn(List.of(
                buildPlan(LocalDate.of(2025, 1, 7), BigDecimal.valueOf(90)),
                buildPlan(LocalDate.of(2025, 1, 11), BigDecimal.valueOf(140))
        ));

        List<TrainingPlanProgramDto> result = service.getPrograms();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getWeeklyObjectives()).hasSize(2);
        assertThat(result.get(0).getWeeklyObjectives().get(0).getObjectiveType()).isEqualTo("BASE_ENDURANCE");
        assertThat(result.get(0).getWeeklyObjectives().get(0).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(230));
        assertThat(result.get(0).getWeeklyObjectives().get(0).getFuelingLabel()).isEqualTo("Dowóz na długi tlen");
    }

    @Test
    void getPrograms_includesGoalScorecardsForActualWork() {
        UUID programId = UUID.randomUUID();
        LocalDate weekStart = LocalDate.of(2025, 1, 6);
        TrainingPlanProgram program = TrainingPlanProgram.builder()
                .id(programId)
                .name("BUILD_PEAK 1w")
                .goal(ProgramGoal.BUILD_PEAK)
                .goalPriority(GoalPriority.A)
                .startDate(weekStart)
                .endDate(weekStart.plusDays(6))
                .targetWeeklyTss(BigDecimal.valueOf(180))
                .generatedBy("auto")
                .build();
        TrainingPlan thresholdPlan = TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(weekStart.plusDays(1))
                .plannedType("THRESHOLD")
                .plannedTss(BigDecimal.valueOf(100))
                .plannedDurationMin(60)
                .status(TrainingPlanStatus.PLANNED)
                .programId(programId)
                .build();
        TrainingPlan endurancePlan = TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(weekStart.plusDays(5))
                .plannedType("ENDURANCE")
                .plannedTss(BigDecimal.valueOf(80))
                .plannedDurationMin(90)
                .status(TrainingPlanStatus.PLANNED)
                .programId(programId)
                .build();
        when(programRepository.findAll()).thenReturn(List.of(program));
        when(trainingPlanRepository.findByProgramId(programId)).thenReturn(List.of(thresholdPlan, endurancePlan));

        UUID thresholdActivityId = UUID.randomUUID();
        UUID enduranceActivityId = UUID.randomUUID();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(
                Activity.builder()
                        .id(thresholdActivityId)
                        .name("Threshold Ride")
                        .sportType("Ride")
                        .startedAt(weekStart.plusDays(1).atTime(8, 0).atOffset(ZoneOffset.UTC))
                        .movingTimeSec(62 * 60)
                        .distanceM(BigDecimal.valueOf(36000))
                        .build(),
                Activity.builder()
                        .id(enduranceActivityId)
                        .name("Long Endurance")
                        .sportType("Ride")
                        .startedAt(weekStart.plusDays(5).atTime(9, 0).atOffset(ZoneOffset.UTC))
                        .movingTimeSec(95 * 60)
                        .distanceM(BigDecimal.valueOf(65000))
                        .build()
        ));
        when(activityMetricRepository.findNumericValues(List.of(thresholdActivityId, enduranceActivityId), "tss"))
                .thenReturn(Map.of(
                        thresholdActivityId, BigDecimal.valueOf(95),
                        enduranceActivityId, BigDecimal.valueOf(75)));

        TrainingGoalScorecardDto scorecard = service.getPrograms().getFirst().getGoalScorecards().getFirst();

        assertThat(scorecard.getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(180));
        assertThat(scorecard.getActualTss()).isEqualByComparingTo(BigDecimal.valueOf(170));
        assertThat(scorecard.getPlannedQualityDays()).isEqualTo(1);
        assertThat(scorecard.getCompletedQualityDays()).isEqualTo(1);
        assertThat(scorecard.getGoalFocusLabel()).isEqualTo("Budowa progu");
        assertThat(scorecard.getGoalFocusRole()).isEqualTo("THRESHOLD_QUALITY");
        assertThat(scorecard.getPlannedGoalSessions()).isEqualTo(1);
        assertThat(scorecard.getCompletedGoalSessions()).isEqualTo(1);
        assertThat(scorecard.getGoalExecutionScore()).isGreaterThanOrEqualTo(80);
        assertThat(scorecard.getGoalExecutionStatus()).isEqualTo("ON_TARGET");
        assertThat(scorecard.getAvgExecutionScore()).isGreaterThanOrEqualTo(80);
        assertThat(scorecard.isOnTrack()).isTrue();
    }

    @Test
    void createPlan_withTemplate_resolvesName() {
        UUID templateId = UUID.randomUUID();
        WorkoutTemplate template = WorkoutTemplate.builder()
                .id(templateId)
                .name("Sweet Spot 2×20")
                .category(WorkoutCategory.SWEET_SPOT)
                .targetTss(BigDecimal.valueOf(75))
                .targetDurationMin(90)
                .relativeEffort(7)
                .steps(List.of())
                .createdBy("system")
                .build();
        when(workoutTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(trainingPlanRepository.save(any(TrainingPlan.class))).thenAnswer(inv -> {
            TrainingPlan p = inv.getArgument(0);
            return TrainingPlan.builder()
                    .id(UUID.randomUUID())
                    .date(p.getDate())
                    .plannedType(p.getPlannedType())
                    .plannedTss(p.getPlannedTss())
                    .plannedDurationMin(p.getPlannedDurationMin())
                    .plannedDescription(p.getPlannedDescription())
                    .workoutTemplateId(p.getWorkoutTemplateId())
                    .status(p.getStatus())
                    .build();
        });

        CreateTrainingPlanRequest request = CreateTrainingPlanRequest.builder()
                .date(LocalDate.of(2025, 1, 6))
                .workoutTemplateId(templateId)
                .build();

        TrainingPlanDto result = service.createPlan(request);

        assertThat(result.getPlannedType()).isEqualTo("SWEET_SPOT");
        assertThat(result.getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(75));
        assertThat(result.getPlannedDurationMin()).isEqualTo(90);
        assertThat(result.getPlannedDescription()).isEqualTo("Sweet Spot 2×20");
        assertThat(result.getWorkoutTemplateName()).isEqualTo("Sweet Spot 2×20");
    }

    @Test
    void createPlan_withoutTemplate_usesRawFields() {
        when(trainingPlanRepository.save(any(TrainingPlan.class))).thenAnswer(inv -> {
            TrainingPlan p = inv.getArgument(0);
            return TrainingPlan.builder()
                    .id(UUID.randomUUID())
                    .date(p.getDate())
                    .plannedType(p.getPlannedType())
                    .plannedTss(p.getPlannedTss())
                    .plannedDurationMin(p.getPlannedDurationMin())
                    .plannedDescription(p.getPlannedDescription())
                    .status(p.getStatus())
                    .build();
        });

        CreateTrainingPlanRequest request = CreateTrainingPlanRequest.builder()
                .date(LocalDate.of(2025, 1, 6))
                .plannedType("ENDURANCE")
                .plannedTss(BigDecimal.valueOf(60))
                .plannedDurationMin(120)
                .plannedDescription("Easy ride")
                .build();

        TrainingPlanDto result = service.createPlan(request);

        assertThat(result.getPlannedType()).isEqualTo("ENDURANCE");
        assertThat(result.getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(60));
        assertThat(result.getPlannedDescription()).isEqualTo("Easy ride");
        assertThat(result.getWorkoutTemplateName()).isNull();
    }

    @Test
    void updateStatus_changesStatus() {
        UUID id = UUID.randomUUID();

        service.updateStatus(id, TrainingPlanStatus.COMPLETED);

        verify(trainingPlanRepository).updateStatus(id, TrainingPlanStatus.COMPLETED);
    }

    @Test
    void recordAdjustmentFeedback_savesFeedbackEntry() {
        UUID planId = UUID.randomUUID();
        RecordAdjustmentFeedbackRequest request = RecordAdjustmentFeedbackRequest.builder()
                .date(LocalDate.of(2025, 1, 7))
                .planId(planId)
                .suggestionType("LIGHTEN")
                .suggestionTitle("Zdejmij intensywność")
                .feedback("ACCEPTED")
                .build();

        service.recordAdjustmentFeedback(request);

        ArgumentCaptor<TrainingAdjustmentFeedback> captor = ArgumentCaptor.forClass(TrainingAdjustmentFeedback.class);
        verify(trainingAdjustmentFeedbackRepository).save(captor.capture());
        assertThat(captor.getValue().getPlanId()).isEqualTo(planId);
        assertThat(captor.getValue().getSuggestionType()).isEqualTo("LIGHTEN");
        assertThat(captor.getValue().getDecision()).isEqualTo(AdjustmentFeedbackDecision.ACCEPTED);
    }

    @Test
    void getCoachMemory_summarizesAcceptedAndRejectedPreferences() {
        when(trainingAdjustmentFeedbackRepository.findByCreatedAtAfter(any())).thenReturn(List.of(
                feedback("LIGHTEN", AdjustmentFeedbackDecision.ACCEPTED),
                feedback("LIGHTEN", AdjustmentFeedbackDecision.ACCEPTED),
                feedback("LIGHTEN", AdjustmentFeedbackDecision.REJECTED),
                feedback("SHIFT", AdjustmentFeedbackDecision.REJECTED),
                feedback("SHIFT", AdjustmentFeedbackDecision.REJECTED)
        ));

        CoachMemorySummaryDto summary = service.getCoachMemory();

        assertThat(summary.getPreferences()).hasSize(2);
        assertThat(summary.getPreferences().getFirst().getSuggestionType()).isEqualTo("LIGHTEN");
        assertThat(summary.getPreferences().getFirst().getAcceptedCount()).isEqualTo(2);
        assertThat(summary.getPreferences().getFirst().getRejectedCount()).isEqualTo(1);
        assertThat(summary.getCoachNote()).contains("LIGHTEN");
        assertThat(summary.getCoachNote()).contains("SHIFT");
    }

    @Test
    void getCalendarView_mergesPlannedAndActual() {
        LocalDate from = LocalDate.of(2025, 1, 6);
        LocalDate to = LocalDate.of(2025, 1, 8);

        TrainingPlan plan = buildPlan(from, BigDecimal.valueOf(80));
        when(trainingPlanRepository.findByDateRange(from, to)).thenReturn(List.of(plan));

        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .name("Morning Ride")
                .sportType("Ride")
                .startedAt(from.atTime(8, 0).atOffset(ZoneOffset.UTC))
                .movingTimeSec(3600)
                .distanceM(BigDecimal.valueOf(40000))
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "tss"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(85)));

        List<CalendarDayDto> result = service.getCalendarView(from, to);

        assertThat(result).hasSize(3);

        CalendarDayDto day1 = result.get(0);
        assertThat(day1.getDate()).isEqualTo(from);
        assertThat(day1.getPlanned()).isNotNull();
        assertThat(day1.getActual()).isNotNull();
        assertThat(day1.getActual().getName()).isEqualTo("Morning Ride");
        assertThat(day1.getCompliance()).isNotNull();
        assertThat(day1.getCompliance()).isCloseTo(106.25, org.assertj.core.data.Offset.offset(0.01));
        assertThat(day1.getExecution()).isNotNull();
        assertThat(day1.getExecution().getOutcome()).isEqualTo("TOO_HARD");

        CalendarDayDto day3 = result.get(2);
        assertThat(day3.getPlanned()).isNull();
        assertThat(day3.getActual()).isNull();
    }

    @Test
    void getCalendarView_marksThresholdSessionAsWellExecutedWhenItMatchesPlan() {
        LocalDate day = LocalDate.of(2025, 1, 6);
        TrainingPlan plan = TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(day)
                .plannedType("THRESHOLD")
                .plannedTss(BigDecimal.valueOf(100))
                .plannedDurationMin(60)
                .plannedDescription("Threshold session")
                .status(TrainingPlanStatus.PLANNED)
                .createdAt(OffsetDateTime.now())
                .build();
        when(trainingPlanRepository.findByDateRange(day, day)).thenReturn(List.of(plan));

        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .name("Threshold Ride")
                .sportType("Ride")
                .startedAt(day.atTime(8, 0).atOffset(ZoneOffset.UTC))
                .movingTimeSec(62 * 60)
                .distanceM(BigDecimal.valueOf(35000))
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "tss"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(95)));

        CalendarDayDto result = service.getCalendarView(day, day).getFirst();

        assertThat(result.getExecution()).isNotNull();
        assertThat(result.getExecution().getOutcome()).isEqualTo("WELL_EXECUTED");
        assertThat(result.getExecution().isStimulusMatch()).isTrue();
        assertThat(result.getExecution().getScore()).isGreaterThanOrEqualTo(85);
    }

    @Test
    void getCalendarView_marksEnduranceRideAsTooHardWhenActualStimulusOvershoots() {
        LocalDate day = LocalDate.of(2025, 1, 6);
        TrainingPlan plan = buildPlan(day, BigDecimal.valueOf(80));
        when(trainingPlanRepository.findByDateRange(day, day)).thenReturn(List.of(plan));

        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .name("Race pace ride")
                .sportType("Ride")
                .startedAt(day.atTime(8, 0).atOffset(ZoneOffset.UTC))
                .movingTimeSec(75 * 60)
                .distanceM(BigDecimal.valueOf(50000))
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "tss"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(110)));

        CalendarDayDto result = service.getCalendarView(day, day).getFirst();

        assertThat(result.getExecution()).isNotNull();
        assertThat(result.getExecution().getOutcome()).isEqualTo("TOO_HARD");
        assertThat(result.getExecution().isStimulusMatch()).isFalse();
        assertThat(result.getExecution().getLabel()).isEqualTo("Za mocno");
    }

    @Test
    void getCalendarView_enrichesAdjustmentWithCoachMemoryHint() {
        LocalDate futureDate = LocalDate.now().plusDays(1);
        LocalDate today = LocalDate.now();
        TrainingPlan plan = buildPlan(futureDate, BigDecimal.valueOf(90));
        when(trainingPlanRepository.findByDateRange(futureDate, futureDate)).thenReturn(List.of(plan));
        when(trainingPlanRepository.findByDateRange(today, futureDate)).thenReturn(List.of(plan));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(dailyMetricRepository.findNumericValue(eq(today), eq("ctl"))).thenReturn(Optional.of(BigDecimal.valueOf(60)));
        when(dailyMetricRepository.findNumericValue(eq(today), eq("atl"))).thenReturn(Optional.of(BigDecimal.valueOf(95)));
        when(trainingAdjustmentFeedbackRepository.findByCreatedAtAfter(any())).thenReturn(List.of(
                feedback("LIGHTEN", AdjustmentFeedbackDecision.ACCEPTED),
                feedback("LIGHTEN", AdjustmentFeedbackDecision.ACCEPTED),
                feedback("LIGHTEN", AdjustmentFeedbackDecision.ACCEPTED)
        ));

        CalendarDayDto day = service.getCalendarView(futureDate, futureDate).getFirst();

        assertThat(day.getAdjustment()).isNotNull();
        assertThat(day.getAdjustment().getType()).isEqualTo("LIGHTEN");
        assertThat(day.getAdjustment().getMemoryHint()).contains("zwykle akceptujesz");
    }

    @Test
    void getCalendarView_addsDetailedReviewForTemplateBasedSession() {
        LocalDate day = LocalDate.of(2025, 1, 6);
        UUID templateId = UUID.randomUUID();
        TrainingPlan plan = TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(day)
                .plannedType("THRESHOLD")
                .plannedTss(BigDecimal.valueOf(95))
                .plannedDurationMin(60)
                .plannedDescription("Threshold build")
                .workoutTemplateId(templateId)
                .status(TrainingPlanStatus.PLANNED)
                .createdAt(OffsetDateTime.now())
                .build();
        when(trainingPlanRepository.findByDateRange(day, day)).thenReturn(List.of(plan));
        when(workoutTemplateRepository.findById(templateId)).thenReturn(Optional.of(WorkoutTemplate.builder()
                .id(templateId)
                .name("Threshold build")
                .category(WorkoutCategory.THRESHOLD)
                .targetTss(BigDecimal.valueOf(95))
                .targetDurationMin(60)
                .relativeEffort(8)
                .intensityFactor(BigDecimal.valueOf(0.95))
                .steps(List.of(
                        WorkoutStep.builder().type("warmup").durationSec(600).powerPctFtpLow(55).powerPctFtpHigh(70).build(),
                        WorkoutStep.builder().type("interval").repeat(3).onDurationSec(480).onPowerPctFtpLow(95).onPowerPctFtpHigh(100).offDurationSec(180).offPowerPctFtpLow(55).offPowerPctFtpHigh(65).build()
                ))
                .createdBy("system")
                .build()));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(AthleteProfile.builder()
                .ftpWatts((short) 280)
                .build()));

        UUID activityId = UUID.randomUUID();
        int[] powerStream = new int[3600];
        for (int i = 0; i < powerStream.length; i++) {
            powerStream[i] = 170;
        }
        for (int i = 600; i < 1080; i++) {
            powerStream[i] = 270;
        }
        for (int i = 1260; i < 1740; i++) {
            powerStream[i] = 270;
        }
        for (int i = 1920; i < 2400; i++) {
            powerStream[i] = 270;
        }
        Activity activity = Activity.builder()
                .id(activityId)
                .name("Threshold Ride")
                .sportType("Ride")
                .startedAt(day.atTime(8, 0).atOffset(ZoneOffset.UTC))
                .movingTimeSec(60 * 60)
                .powerStream(powerStream)
                .avgPowerW((short) 225)
                .distanceM(BigDecimal.valueOf(32000))
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "tss"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(94)));

        CalendarDayDto result = service.getCalendarView(day, day).getFirst();

        assertThat(result.getExecution()).isNotNull();
        assertThat(result.getExecution().getIntervalCompliance()).isGreaterThan(80.0);
        assertThat(result.getExecution().getZoneCompliance()).isGreaterThan(50.0);
        assertThat(result.getExecution().getPrimaryLimiter()).isEqualTo("ON_TARGET");
        assertThat(result.getExecution().getNextDayAdvice()).contains("kolejn");
    }

    @Test
    void getCalendarView_autoSwapsOutdoorSessionWhenWeatherAndRoutesBlockIt() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        UUID programId = UUID.randomUUID();
        UUID originalTemplateId = UUID.randomUUID();
        TrainingPlan plan = TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(tomorrow)
                .plannedType("ENDURANCE")
                .plannedTss(BigDecimal.valueOf(140))
                .plannedDurationMin(180)
                .plannedDescription("Long Ride Outdoor")
                .workoutTemplateId(originalTemplateId)
                .programId(programId)
                .status(TrainingPlanStatus.PLANNED)
                .createdAt(OffsetDateTime.now())
                .build();
        when(trainingPlanRepository.findByDateRange(tomorrow, tomorrow)).thenReturn(List.of(plan));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(programRepository.findById(programId)).thenReturn(Optional.of(TrainingPlanProgram.builder()
                .id(programId)
                .name("BUILD_BASE")
                .goal(ProgramGoal.BUILD_BASE)
                .goalPriority(GoalPriority.B)
                .startDate(tomorrow.minusDays(7))
                .endDate(tomorrow.plusDays(21))
                .environmentPreference("OUTDOOR_FOCUSED")
                .weekdayAvailabilityMinutes(90)
                .weekendAvailabilityMinutes(180)
                .preferredLongRideDay("SATURDAY")
                .generatedBy("auto")
                .build()));
        when(trainingDayEnvironmentPort.getEnvironmentFor(tomorrow)).thenReturn(Optional.of(TrainingDayEnvironment.builder()
                .date(tomorrow)
                .locationName("Krakow")
                .outdoorScore(28)
                .bestWindowScore(35)
                .weatherDescription("Silny wiatr i opady")
                .build()));
        when(plannedRouteRepository.findAll()).thenReturn(List.of(PlannedRoute.builder()
                .id(UUID.randomUUID())
                .name("Short Route")
                .estimatedTimeSec(50 * 60)
                .estimatedTss(45)
                .build()));
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(originalTemplateId)
                        .name("Long Ride Outdoor")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(140))
                        .targetDurationMin(180)
                        .relativeEffort(5)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Indoor Sweet Spot")
                        .category(WorkoutCategory.SWEET_SPOT)
                        .targetTss(BigDecimal.valueOf(130))
                        .targetDurationMin(90)
                        .relativeEffort(7)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));

        CalendarDayDto result = service.getCalendarView(tomorrow, tomorrow).getFirst();

        assertThat(result.getPlanned()).isNotNull();
        assertThat(result.getPlanned().getPlannedType()).isEqualTo("SWEET_SPOT");
        assertThat(result.getPlanned().getPlannedDescription()).isEqualTo("Indoor Sweet Spot");
        assertThat(result.getAdjustment()).isNotNull();
        assertThat(result.getAdjustment().getType()).isEqualTo("AUTO_SWAP");
        assertThat(result.getAdjustment().getTitle()).contains("Auto-swap");
    }

    @Test
    void getCalendarView_includesProjectionForFuturePlannedDay() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        LocalDate to = today.plusDays(2);

        TrainingPlan tomorrowPlan = buildPlan(tomorrow, BigDecimal.valueOf(85));
        when(trainingPlanRepository.findByDateRange(today, to)).thenReturn(List.of(tomorrowPlan));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(dailyMetricRepository.findNumericValue(today, "ctl")).thenReturn(Optional.of(BigDecimal.valueOf(70)));
        when(dailyMetricRepository.findNumericValue(today, "atl")).thenReturn(Optional.of(BigDecimal.valueOf(75)));

        List<CalendarDayDto> result = service.getCalendarView(today, to);

        CalendarDayDto projectedDay = result.stream()
                .filter(day -> day.getDate().equals(tomorrow))
                .findFirst()
                .orElseThrow();

        assertThat(projectedDay.getProjection()).isNotNull();
        assertThat(projectedDay.getProjection().getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(85));
        assertThat(projectedDay.getProjection().getProjectedCtl()).isGreaterThan(BigDecimal.valueOf(70));
        assertThat(projectedDay.getProjection().getProjectedTsb()).isEqualByComparingTo(BigDecimal.valueOf(-5.00));
        assertThat(projectedDay.getProjection().getDayType()).isEqualTo("TEMPO");
        assertThat(projectedDay.getAdjustment()).isNull();
    }

    @Test
    void getCalendarView_suggestsAdjustmentWhenProjectedFatigueIsTooDeep() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        LocalDate to = today.plusDays(2);

        TrainingPlan overloadPlan = buildPlan(tomorrow, BigDecimal.valueOf(110));
        when(trainingPlanRepository.findByDateRange(today, to)).thenReturn(List.of(overloadPlan));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(dailyMetricRepository.findNumericValue(today, "ctl")).thenReturn(Optional.of(BigDecimal.valueOf(70)));
        when(dailyMetricRepository.findNumericValue(today, "atl")).thenReturn(Optional.of(BigDecimal.valueOf(98)));

        List<CalendarDayDto> result = service.getCalendarView(today, to);

        CalendarDayDto projectedDay = result.stream()
                .filter(day -> day.getDate().equals(tomorrow))
                .findFirst()
                .orElseThrow();

        assertThat(projectedDay.getProjection()).isNotNull();
        assertThat(projectedDay.getAdjustment()).isNotNull();
        assertThat(projectedDay.getAdjustment().getType()).isEqualTo("LIGHTEN");
        assertThat(projectedDay.getAdjustment().getTitle()).contains("Zdejmij intensywność");
    }

    @Test
    void generatePlan_createsCorrectNumberOfDays() {
        when(programRepository.save(any(TrainingPlanProgram.class))).thenAnswer(inv -> {
            TrainingPlanProgram p = inv.getArgument(0);
            return TrainingPlanProgram.builder()
                    .id(UUID.randomUUID())
                    .name(p.getName())
                    .goal(p.getGoal())
                    .goalPriority(p.getGoalPriority())
                    .startDate(p.getStartDate())
                    .endDate(p.getEndDate())
                    .eventDate(p.getEventDate())
                    .taperStartDate(p.getTaperStartDate())
                    .targetWeeklyTss(p.getTargetWeeklyTss())
                    .generatedBy(p.getGeneratedBy())
                    .build();
        });
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(
                AthleteProfile.builder().ftpWatts((short) 250).build()));
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Endurance")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(60))
                        .targetDurationMin(90)
                        .relativeEffort(5)
                        .intensityFactor(BigDecimal.valueOf(0.70))
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        when(trainingPlanRepository.save(any(TrainingPlan.class))).thenAnswer(inv -> {
            TrainingPlan p = inv.getArgument(0);
            return TrainingPlan.builder()
                    .id(UUID.randomUUID())
                    .date(p.getDate())
                    .plannedType(p.getPlannedType())
                    .plannedTss(p.getPlannedTss())
                    .plannedDurationMin(p.getPlannedDurationMin())
                    .plannedDescription(p.getPlannedDescription())
                    .programId(p.getProgramId())
                    .workoutTemplateId(p.getWorkoutTemplateId())
                    .targetPowerLowW(p.getTargetPowerLowW())
                    .targetPowerHighW(p.getTargetPowerHighW())
                    .status(p.getStatus())
                    .build();
        });

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6)) // Monday
                .weeks(4)
                .trainingDaysPerWeek(3)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        TrainingPlanProgramDto result = service.generatePlan(request);

        assertThat(result).isNotNull();
        assertThat(result.getGoal()).isEqualTo("BUILD_BASE");
        assertThat(result.getWeeklyObjectives()).hasSize(4);
        assertThat(result.getWeeklyObjectives().get(0).getObjectiveType()).isEqualTo("BASE_ENDURANCE");

        // 4 weeks × 3 days = 12 plans
        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(12)).save(captor.capture());
        assertThat(captor.getAllValues()).hasSize(12);
    }

    @Test
    void generatePlan_follows3to1Periodization() {
        when(programRepository.save(any(TrainingPlanProgram.class))).thenAnswer(inv -> {
            TrainingPlanProgram p = inv.getArgument(0);
            return TrainingPlanProgram.builder()
                    .id(UUID.randomUUID())
                    .name(p.getName())
                    .goal(p.getGoal())
                    .startDate(p.getStartDate())
                    .endDate(p.getEndDate())
                    .targetWeeklyTss(p.getTargetWeeklyTss())
                    .generatedBy(p.getGeneratedBy())
                    .build();
        });
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutTemplateRepository.findAll()).thenReturn(List.of());
        when(trainingPlanRepository.save(any(TrainingPlan.class))).thenAnswer(inv -> {
            TrainingPlan p = inv.getArgument(0);
            return TrainingPlan.builder()
                    .id(UUID.randomUUID())
                    .date(p.getDate())
                    .plannedTss(p.getPlannedTss())
                    .status(p.getStatus())
                    .programId(p.getProgramId())
                    .build();
        });

        BigDecimal targetWeeklyTss = BigDecimal.valueOf(400);
        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6)) // Monday
                .weeks(4)
                .trainingDaysPerWeek(1) // Only Saturday for simplicity
                .targetWeeklyTss(targetWeeklyTss)
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(4)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        // Week 1: 0.95× target = 380
        assertThat(plans.get(0).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(380.00).setScale(2));
        // Week 2: 1.00× target = 400
        assertThat(plans.get(1).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(400.00).setScale(2));
        // Week 3: 1.05× target = 420
        assertThat(plans.get(2).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(420.00).setScale(2));
        // Week 4 (recovery): 0.60× target = 240
        assertThat(plans.get(3).getPlannedTss()).isEqualByComparingTo(BigDecimal.valueOf(240.00).setScale(2));
    }

    @Test
    void generatePlan_distributesTssCorrectlyAcrossWeek() {
        when(programRepository.save(any(TrainingPlanProgram.class))).thenAnswer(inv -> {
            TrainingPlanProgram p = inv.getArgument(0);
            return TrainingPlanProgram.builder()
                    .id(UUID.randomUUID())
                    .name(p.getName())
                    .goal(p.getGoal())
                    .startDate(p.getStartDate())
                    .endDate(p.getEndDate())
                    .targetWeeklyTss(p.getTargetWeeklyTss())
                    .generatedBy(p.getGeneratedBy())
                    .build();
        });
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutTemplateRepository.findAll()).thenReturn(List.of());
        when(trainingPlanRepository.save(any(TrainingPlan.class))).thenAnswer(inv -> {
            TrainingPlan p = inv.getArgument(0);
            return TrainingPlan.builder()
                    .id(UUID.randomUUID())
                    .date(p.getDate())
                    .plannedTss(p.getPlannedTss())
                    .status(p.getStatus())
                    .programId(p.getProgramId())
                    .build();
        });

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6)) // Monday
                .weeks(1)
                .trainingDaysPerWeek(3) // Sat(0.30), Wed(0.20), Tue(0.15)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        // Plans should be sorted by date: Tue, Wed, Sat
        plans.sort((a, b) -> a.getDate().compareTo(b.getDate()));

        BigDecimal totalTss = plans.stream()
                .map(TrainingPlan::getPlannedTss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total TSS across all days should equal first-week TSS (0.95 × 400 = 380)
        assertThat(totalTss).isCloseTo(BigDecimal.valueOf(380), org.assertj.core.data.Percentage.withPercentage(1));

        // Saturday should get the largest share
        TrainingPlan saturdayPlan = plans.stream()
                .filter(p -> p.getDate().getDayOfWeek() == DayOfWeek.SATURDAY)
                .findFirst().orElseThrow();
        TrainingPlan tuesdayPlan = plans.stream()
                .filter(p -> p.getDate().getDayOfWeek() == DayOfWeek.TUESDAY)
                .findFirst().orElseThrow();

        assertThat(saturdayPlan.getPlannedTss()).isGreaterThan(tuesdayPlan.getPlannedTss());
    }

    @Test
    void generatePlan_progressiveOverload_increasesWeeklyTss() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutTemplateRepository.findAll()).thenReturn(List.of());
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(3)
                .trainingDaysPerWeek(1)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        // Each build week should have higher TSS than the previous
        assertThat(plans.get(0).getPlannedTss()).isLessThan(plans.get(1).getPlannedTss());
        assertThat(plans.get(1).getPlannedTss()).isLessThan(plans.get(2).getPlannedTss());
    }

    @Test
    void generatePlan_recoveryWeek_reducesToSixtyPercent() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());

        UUID thresholdId = UUID.randomUUID();
        UUID enduranceId = UUID.randomUUID();
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(thresholdId)
                        .name("Threshold Intervals")
                        .category(WorkoutCategory.THRESHOLD)
                        .targetTss(BigDecimal.valueOf(90))
                        .targetDurationMin(60)
                        .relativeEffort(8)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(enduranceId)
                        .name("Easy Spin")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(50))
                        .targetDurationMin(60)
                        .relativeEffort(3)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(4)
                .trainingDaysPerWeek(1)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(4)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        TrainingPlan recoveryPlan = plans.get(3);
        // Recovery week TSS should be 60% of target
        assertThat(recoveryPlan.getPlannedTss())
                .isEqualByComparingTo(BigDecimal.valueOf(240.00).setScale(2));
        // Recovery week should use ENDURANCE template, not THRESHOLD
        assertThat(recoveryPlan.getWorkoutTemplateId()).isEqualTo(enduranceId);
    }

    @Test
    void generatePlan_avoidsSameTemplateConsecutively() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());

        UUID templateA = UUID.randomUUID();
        UUID templateB = UUID.randomUUID();
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(templateA)
                        .name("Endurance A")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(60))
                        .targetDurationMin(90)
                        .relativeEffort(5)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(templateB)
                        .name("Endurance B")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(62))
                        .targetDurationMin(90)
                        .relativeEffort(5)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(1)
                .trainingDaysPerWeek(3)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        for (int i = 1; i < plans.size(); i++) {
            assertThat(plans.get(i).getWorkoutTemplateId())
                    .as("Day %d should differ from day %d", i, i - 1)
                    .isNotEqualTo(plans.get(i - 1).getWorkoutTemplateId());
        }
    }

    @Test
    void generatePlan_weekendPrefsLongRide() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());

        UUID longRideId = UUID.randomUUID();
        UUID tempoId = UUID.randomUUID();
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(longRideId)
                        .name("Long Ride")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(120))
                        .targetDurationMin(180)
                        .relativeEffort(5)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(tempoId)
                        .name("Tempo Intervals")
                        .category(WorkoutCategory.TEMPO)
                        .targetTss(BigDecimal.valueOf(175))
                        .targetDurationMin(90)
                        .relativeEffort(7)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(1)
                .trainingDaysPerWeek(3)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        TrainingPlan saturdayPlan = plans.stream()
                .filter(p -> p.getDate().getDayOfWeek() == DayOfWeek.SATURDAY)
                .findFirst().orElseThrow();
        assertThat(saturdayPlan.getWorkoutTemplateId()).isEqualTo(longRideId);
    }

    @Test
    void generatePlan_noTemplates_returnsEmptyProgram() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutTemplateRepository.findAll()).thenReturn(List.of());
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(1)
                .trainingDaysPerWeek(1)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(1)).save(captor.capture());
        TrainingPlan plan = captor.getValue();

        assertThat(plan.getPlannedTss()).isNotNull();
        assertThat(plan.getWorkoutTemplateId()).isNull();
        assertThat(plan.getPlannedType()).isNull();
        assertThat(plan.getTargetPowerLowW()).isNull();
        assertThat(plan.getTargetPowerHighW()).isNull();
    }

    @Test
    void generatePlan_nullFtp_usesFallback() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());

        BigDecimal intensityFactor = BigDecimal.valueOf(0.70);
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Endurance")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(60))
                        .targetDurationMin(90)
                        .relativeEffort(5)
                        .intensityFactor(intensityFactor)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(1)
                .trainingDaysPerWeek(1)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        service.generatePlan(request);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository).save(captor.capture());
        TrainingPlan plan = captor.getValue();

        double expectedAvgPower = TrainingPlanService.DEFAULT_FTP_WATTS * intensityFactor.doubleValue();
        assertThat(plan.getTargetPowerLowW()).isEqualTo((int) (expectedAvgPower * 0.95));
        assertThat(plan.getTargetPowerHighW()).isEqualTo((int) (expectedAvgPower * 1.05));
    }

    @Test
    void generatePlan_withGoalPriorityAndEventDate_appliesTaperAndReturnsMetadata() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutTemplateRepository.findAll()).thenReturn(List.of());
        stubPlanSave();

        LocalDate startDate = LocalDate.of(2025, 1, 6);
        LocalDate eventDate = startDate.plusWeeks(3).minusDays(1);
        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_PEAK")
                .goalPriority("A")
                .startDate(startDate)
                .eventDate(eventDate)
                .weeks(3)
                .trainingDaysPerWeek(1)
                .targetWeeklyTss(BigDecimal.valueOf(400))
                .build();

        TrainingPlanProgramDto result = service.generatePlan(request);

        assertThat(result.getGoalPriority()).isEqualTo("A");
        assertThat(result.getEventDate()).isEqualTo(eventDate);
        assertThat(result.getTaperStartDate()).isEqualTo(eventDate.minusDays(13));

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        List<TrainingPlan> plans = captor.getAllValues();

        assertThat(plans.get(2).getPlannedTss()).isLessThan(plans.get(1).getPlannedTss());
        assertThat(plans.get(2).getPlannedTss()).isLessThan(BigDecimal.valueOf(300));
    }

    @Test
    void generatePlan_buildPeakLimitsHardDaysAndReturnsThresholdObjective() {
        stubProgramSave();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Threshold")
                        .category(WorkoutCategory.THRESHOLD)
                        .targetTss(BigDecimal.valueOf(90))
                        .targetDurationMin(70)
                        .relativeEffort(8)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("VO2")
                        .category(WorkoutCategory.VO2MAX)
                        .targetTss(BigDecimal.valueOf(92))
                        .targetDurationMin(60)
                        .relativeEffort(9)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Endurance")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(60))
                        .targetDurationMin(120)
                        .relativeEffort(5)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        stubPlanSave();

        GeneratePlanRequest request = GeneratePlanRequest.builder()
                .goal("BUILD_PEAK")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(1)
                .trainingDaysPerWeek(4)
                .targetWeeklyTss(BigDecimal.valueOf(420))
                .build();

        TrainingPlanProgramDto result = service.generatePlan(request);

        assertThat(result.getWeeklyObjectives()).singleElement()
                .extracting("objectiveType", "maxQualityDays", "fuelingLabel")
                .containsExactly("BUILD_THRESHOLD", 2, "Węgle pod akcent");
        assertThat(result.getGoalScorecards()).singleElement()
                .extracting("plannedQualityDays", "completedQualityDays", "actualTss")
                .containsExactly(2, 0, BigDecimal.ZERO);

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(4)).save(captor.capture());
        long hardDays = captor.getAllValues().stream()
                .filter(plan -> plan.getPlannedType() != null)
                .filter(plan -> Set.of("THRESHOLD", "VO2MAX", "ANAEROBIC").contains(plan.getPlannedType()))
                .count();
        assertThat(hardDays).isLessThanOrEqualTo(2);
    }

    @Test
    void generatePlan_persistsConstraintsAndMovesLongRideToPreferredDay() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(AthleteProfile.builder()
                .ftpWatts((short) 280)
                .build()));
        when(workoutTemplateRepository.findAll()).thenReturn(List.of(
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Threshold Builder")
                        .category(WorkoutCategory.THRESHOLD)
                        .targetTss(BigDecimal.valueOf(90))
                        .targetDurationMin(60)
                        .relativeEffort(8)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Long Ride Outdoor")
                        .category(WorkoutCategory.ENDURANCE)
                        .targetTss(BigDecimal.valueOf(120))
                        .targetDurationMin(200)
                        .relativeEffort(5)
                        .steps(List.of())
                        .createdBy("system")
                        .build(),
                WorkoutTemplate.builder()
                        .id(UUID.randomUUID())
                        .name("Tempo Builder")
                        .category(WorkoutCategory.TEMPO)
                        .targetTss(BigDecimal.valueOf(70))
                        .targetDurationMin(75)
                        .relativeEffort(6)
                        .steps(List.of())
                        .createdBy("system")
                        .build()
        ));
        stubProgramSave();
        stubPlanSave();

        TrainingPlanProgramDto result = service.generatePlan(GeneratePlanRequest.builder()
                .goal("BUILD_BASE")
                .startDate(LocalDate.of(2025, 1, 6))
                .weeks(1)
                .trainingDaysPerWeek(4)
                .targetWeeklyTss(BigDecimal.valueOf(360))
                .weekdayAvailabilityMinutes(45)
                .weekendAvailabilityMinutes(210)
                .preferredLongRideDay("SUNDAY")
                .environmentPreference("OUTDOOR_FOCUSED")
                .build());

        assertThat(result.getWeekdayAvailabilityMinutes()).isEqualTo(45);
        assertThat(result.getWeekendAvailabilityMinutes()).isEqualTo(210);
        assertThat(result.getPreferredLongRideDay()).isEqualTo("SUNDAY");
        assertThat(result.getEnvironmentPreference()).isEqualTo("OUTDOOR_FOCUSED");

        ArgumentCaptor<TrainingPlan> captor = ArgumentCaptor.forClass(TrainingPlan.class);
        verify(trainingPlanRepository, org.mockito.Mockito.times(4)).save(captor.capture());
        List<TrainingPlan> savedPlans = captor.getAllValues();
        assertThat(savedPlans.stream()
                .filter(plan -> plan.getDate().getDayOfWeek().getValue() <= 5)
                .map(TrainingPlan::getPlannedDurationMin))
                .allMatch(duration -> duration != null && duration <= 45);
        assertThat(savedPlans).anySatisfy(plan -> {
            assertThat(plan.getDate().getDayOfWeek()).isEqualTo(DayOfWeek.SUNDAY);
            assertThat(plan.getPlannedDescription()).isEqualTo("Long Ride Outdoor");
            assertThat(plan.getPlannedDurationMin()).isEqualTo(200);
        });
    }

    private void stubProgramSave() {
        when(programRepository.save(any(TrainingPlanProgram.class))).thenAnswer(inv -> {
            TrainingPlanProgram p = inv.getArgument(0);
            return TrainingPlanProgram.builder()
                    .id(UUID.randomUUID())
                    .name(p.getName())
                    .goal(p.getGoal())
                    .goalPriority(p.getGoalPriority() != null ? p.getGoalPriority() : GoalPriority.B)
                    .startDate(p.getStartDate())
                    .endDate(p.getEndDate())
                    .eventDate(p.getEventDate())
                    .taperStartDate(p.getTaperStartDate())
                    .targetWeeklyTss(p.getTargetWeeklyTss())
                    .targetWeeklyHours(p.getTargetWeeklyHours())
                    .weekdayAvailabilityMinutes(p.getWeekdayAvailabilityMinutes())
                    .weekendAvailabilityMinutes(p.getWeekendAvailabilityMinutes())
                    .preferredLongRideDay(p.getPreferredLongRideDay())
                    .environmentPreference(p.getEnvironmentPreference())
                    .generatedBy(p.getGeneratedBy())
                    .build();
        });
    }

    private void stubPlanSave() {
        when(trainingPlanRepository.save(any(TrainingPlan.class))).thenAnswer(inv -> {
            TrainingPlan p = inv.getArgument(0);
            return TrainingPlan.builder()
                    .id(UUID.randomUUID())
                    .date(p.getDate())
                    .plannedType(p.getPlannedType())
                    .plannedTss(p.getPlannedTss())
                    .plannedDurationMin(p.getPlannedDurationMin())
                    .plannedDescription(p.getPlannedDescription())
                    .programId(p.getProgramId())
                    .workoutTemplateId(p.getWorkoutTemplateId())
                    .targetPowerLowW(p.getTargetPowerLowW())
                    .targetPowerHighW(p.getTargetPowerHighW())
                    .status(p.getStatus())
                    .build();
        });
    }

    private TrainingPlan buildPlan(LocalDate date, BigDecimal tss) {
        return TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(date)
                .plannedType("ENDURANCE")
                .plannedTss(tss)
                .plannedDurationMin(90)
                .plannedDescription("Endurance ride")
                .status(TrainingPlanStatus.PLANNED)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private TrainingAdjustmentFeedback feedback(String suggestionType, AdjustmentFeedbackDecision decision) {
        return TrainingAdjustmentFeedback.builder()
                .id(UUID.randomUUID())
                .date(LocalDate.now().minusDays(2))
                .suggestionType(suggestionType)
                .suggestionTitle(suggestionType)
                .decision(decision)
                .createdAt(OffsetDateTime.now().minusDays(2))
                .build();
    }
}
