package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.BlockHealthDto;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.TrainingAdjustmentSuggestionDto;
import pl.strava.analizator.application.dto.TrainingExecutionAssessmentDto;
import pl.strava.analizator.application.dto.TrainingGoalScorecardDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.application.dto.TrainingWeekObjectiveDto;

class BlockHealthServiceTest {

    private TrainingPlanService trainingPlanService;
    private AnalyticsService analyticsService;
    private BlockHealthService blockHealthService;

    @BeforeEach
    void setUp() {
        trainingPlanService = mock(TrainingPlanService.class);
        analyticsService = mock(AnalyticsService.class);
        blockHealthService = new BlockHealthService(trainingPlanService, analyticsService);
    }

    @Test
    void getCurrentBlockHealth_returnsChaoticBlockWhenGoalIsMissedAndAdjustmentsStackUp() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(trainingPlanService.getPrograms()).thenReturn(List.of(currentProgram(today, "MISSED", 0, 2)));
        when(trainingPlanService.getCalendarView(today.minusDays(13), today)).thenReturn(List.of(
                adjustedDay(today.minusDays(4), "MISSED_STIMULUS"),
                adjustedDay(today.minusDays(2), "TOO_EASY"),
                adjustedDay(today.minusDays(1), "MISSED_STIMULUS")
        ));
        when(analyticsService.getProgressionLevels()).thenReturn(List.of(
                ProgressionLevelDto.builder()
                        .system("THRESHOLD")
                        .label("Próg")
                        .level(4)
                        .currentLoad(BigDecimal.valueOf(48))
                        .previousLoad(BigDecimal.valueOf(62))
                        .targetLoad(BigDecimal.valueOf(70))
                        .trend("DOWN")
                        .description("Próg siada.")
                        .nextRecommendation("Wróć do kontrolowanego progu.")
                        .build()
        ));
        when(analyticsService.getReadiness()).thenReturn(ReadinessDto.builder().score(46).dayLabel("Tlen").build());

        BlockHealthDto result = blockHealthService.getCurrentBlockHealth();

        assertThat(result.getStatus()).isEqualTo("CHAOTIC_BLOCK");
        assertThat(result.getAdjustmentDays()).isEqualTo(3);
        assertThat(result.getMissedStimulusDays()).isEqualTo(3);
        assertThat(result.getGoalExecutionStatus()).isEqualTo("MISSED");
        assertThat(result.getKeySignals()).isNotEmpty();
    }

    @Test
    void getCurrentBlockHealth_returnsStableProductiveWhenBlockIsOnTrack() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(trainingPlanService.getPrograms()).thenReturn(List.of(currentProgram(today, "ON_TARGET", 1, 1)));
        when(trainingPlanService.getCalendarView(today.minusDays(13), today)).thenReturn(List.of(
                regularDay(today.minusDays(3), "WELL_EXECUTED", null),
                regularDay(today.minusDays(1), "WELL_EXECUTED", null)
        ));
        when(analyticsService.getProgressionLevels()).thenReturn(List.of(
                ProgressionLevelDto.builder()
                        .system("THRESHOLD")
                        .label("Próg")
                        .level(6)
                        .currentLoad(BigDecimal.valueOf(76))
                        .previousLoad(BigDecimal.valueOf(65))
                        .targetLoad(BigDecimal.valueOf(70))
                        .trend("UP")
                        .description("Próg rośnie.")
                        .nextRecommendation("Broń jednego akcentu progowego.")
                        .build()
        ));
        when(analyticsService.getReadiness()).thenReturn(ReadinessDto.builder().score(68).dayLabel("Tempo").build());

        BlockHealthDto result = blockHealthService.getCurrentBlockHealth();

        assertThat(result.getStatus()).isEqualTo("STABLE_PRODUCTIVE");
        assertThat(result.getAdjustmentDays()).isZero();
        assertThat(result.getOverloadDays()).isZero();
        assertThat(result.getGoalExecutionStatus()).isEqualTo("ON_TARGET");
    }

    private TrainingPlanProgramDto currentProgram(LocalDate today, String goalStatus, int completedGoalSessions, int plannedGoalSessions) {
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return new TrainingPlanProgramDto(
                UUID.randomUUID(),
                "BUILD_PEAK 4w",
                "BUILD_PEAK",
                "A",
                today.minusWeeks(1),
                today.plusWeeks(2),
                null,
                null,
                List.of(new TrainingWeekObjectiveDto(
                        weekStart,
                        weekStart.plusDays(6),
                        "BUILD_THRESHOLD",
                        "Budowa progu",
                        "Broń jednego progu.",
                        BigDecimal.valueOf(420),
                        2,
                        List.of("THRESHOLD"),
                        "Węgle pod akcent",
                        "Najwięcej węgli wokół jakości.")),
                List.of(TrainingGoalScorecardDto.builder()
                        .weekStart(weekStart)
                        .weekEnd(weekStart.plusDays(6))
                        .label("Budowa progu")
                        .plannedTss(BigDecimal.valueOf(420))
                        .actualTss(BigDecimal.valueOf(360))
                        .plannedQualityDays(2)
                        .completedQualityDays(1)
                        .goalFocusLabel("Budowa progu")
                        .goalFocusRole("THRESHOLD_QUALITY")
                        .plannedGoalSessions(plannedGoalSessions)
                        .completedGoalSessions(completedGoalSessions)
                        .goalExecutionScore("ON_TARGET".equals(goalStatus) ? 86 : 44)
                        .goalExecutionStatus(goalStatus)
                        .avgExecutionScore(84)
                        .onTrack("ON_TARGET".equals(goalStatus))
                        .build()),
                BigDecimal.valueOf(420),
                BigDecimal.valueOf(8),
                90,
                180,
                "SATURDAY",
                "MIXED",
                "auto",
                null
        );
    }

    private CalendarDayDto adjustedDay(LocalDate date, String outcome) {
        return regularDay(date, outcome, TrainingAdjustmentSuggestionDto.builder()
                .type("AUTO_SWAP")
                .title("Auto-swap")
                .description("Korekta dnia.")
                .build());
    }

    private CalendarDayDto regularDay(LocalDate date, String outcome, TrainingAdjustmentSuggestionDto adjustment) {
        return CalendarDayDto.builder()
                .date(date)
                .adjustment(adjustment)
                .execution(TrainingExecutionAssessmentDto.builder()
                        .outcome(outcome)
                        .label(outcome)
                        .description(outcome)
                        .score("WELL_EXECUTED".equals(outcome) ? 90 : 52)
                        .stimulusMatch("WELL_EXECUTED".equals(outcome))
                        .build())
                .build();
    }
}
