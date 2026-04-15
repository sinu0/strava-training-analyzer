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
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.CreateTrainingPlanRequest;
import pl.strava.analizator.application.dto.GeneratePlanRequest;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
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

        CalendarDayDto day3 = result.get(2);
        assertThat(day3.getPlanned()).isNull();
        assertThat(day3.getActual()).isNull();
    }

    @Test
    void generatePlan_createsCorrectNumberOfDays() {
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

    private void stubProgramSave() {
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
}
