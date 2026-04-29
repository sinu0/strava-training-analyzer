package pl.strava.analizator.infrastructure.web;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.TrainingPlanService;
import pl.strava.analizator.application.dto.CalendarActivitySummaryDto;
import pl.strava.analizator.application.dto.TrainingAdjustmentSuggestionDto;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.RecordAdjustmentFeedbackRequest;
import pl.strava.analizator.application.dto.TrainingDayProjectionDto;
import pl.strava.analizator.application.dto.TrainingExecutionAssessmentDto;
import pl.strava.analizator.application.dto.TrainingGoalScorecardDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.application.dto.TrainingWeekObjectiveDto;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

@WebMvcTest(TrainingPlanController.class)
@Import(SecurityConfig.class)
class TrainingPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TrainingPlanService trainingPlanService;

    @Test
    void getPlans_returns200() throws Exception {
        LocalDate from = LocalDate.of(2025, 1, 6);
        LocalDate to = LocalDate.of(2025, 1, 12);

        TrainingPlanDto dto = TrainingPlanDto.builder()
                .id(UUID.randomUUID())
                .date(from)
                .plannedType("ENDURANCE")
                .plannedTss(BigDecimal.valueOf(80))
                .status("PLANNED")
                .build();

        when(trainingPlanService.getPlans(from, to)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/training/plans")
                        .param("from", "2025-01-06")
                        .param("to", "2025-01-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].plannedType", is("ENDURANCE")));
    }

    @Test
    void createPlan_returns201() throws Exception {
        TrainingPlanDto dto = TrainingPlanDto.builder()
                .id(UUID.randomUUID())
                .date(LocalDate.of(2025, 1, 6))
                .plannedType("THRESHOLD")
                .plannedTss(BigDecimal.valueOf(90))
                .status("PLANNED")
                .build();

        when(trainingPlanService.createPlan(any())).thenReturn(dto);

        mockMvc.perform(post("/api/training/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "date": "2025-01-06",
                                "plannedType": "THRESHOLD",
                                "plannedTss": 90,
                                "plannedDurationMin": 60
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.plannedType", is("THRESHOLD")));
    }

    @Test
    void updateStatus_returns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(put("/api/training/plans/{id}/status", id)
                        .param("status", "COMPLETED"))
                .andExpect(status().isNoContent());

        verify(trainingPlanService).updateStatus(id, TrainingPlanStatus.COMPLETED);
    }

    @Test
    void deletePlan_returns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/training/plans/{id}", id))
                .andExpect(status().isNoContent());

        verify(trainingPlanService).deletePlan(id);
    }

    @Test
    void getCalendar_returnsMergedData() throws Exception {
        LocalDate from = LocalDate.of(2025, 1, 6);
        LocalDate to = LocalDate.of(2025, 1, 7);

        CalendarDayDto day1 = CalendarDayDto.builder()
                .date(from)
                .planned(TrainingPlanDto.builder()
                        .id(UUID.randomUUID())
                        .date(from)
                        .plannedType("ENDURANCE")
                        .plannedTss(BigDecimal.valueOf(80))
                        .status("PLANNED")
                        .build())
                .actual(CalendarActivitySummaryDto.builder()
                        .id(UUID.randomUUID())
                        .name("Morning Ride")
                        .sportType("Ride")
                        .durationMin(60)
                        .tss(BigDecimal.valueOf(85))
                        .build())
                .compliance(106.25)
                .projection(TrainingDayProjectionDto.builder()
                        .plannedTss(BigDecimal.valueOf(80))
                        .projectedCtl(BigDecimal.valueOf(71.1))
                        .projectedAtl(BigDecimal.valueOf(77.2))
                        .projectedTsb(BigDecimal.valueOf(-6.0))
                        .projectedReadiness(68)
                        .dayType("TEMPO")
                        .dayLabel("Tempo")
                        .taperDay(false)
                        .build())
                .adjustment(TrainingAdjustmentSuggestionDto.builder()
                        .type("LIGHTEN")
                        .title("Zdejmij intensywność")
                        .description("ATL jest już wysoko względem CTL.")
                        .build())
                .execution(TrainingExecutionAssessmentDto.builder()
                        .outcome("WELL_EXECUTED")
                        .label("Trafiony bodziec")
                        .description("Czas i obciążenie były blisko planu.")
                        .score(92)
                        .tssCompliance(106.25)
                        .durationCompliance(100.0)
                        .stimulusMatch(true)
                        .build())
                .build();

        CalendarDayDto day2 = CalendarDayDto.builder()
                .date(to)
                .build();

        when(trainingPlanService.getCalendarView(from, to)).thenReturn(List.of(day1, day2));

        mockMvc.perform(get("/api/training/calendar")
                        .param("from", "2025-01-06")
                        .param("to", "2025-01-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].planned.plannedType", is("ENDURANCE")))
                .andExpect(jsonPath("$[0].actual.name", is("Morning Ride")))
                .andExpect(jsonPath("$[0].compliance", is(106.25)))
                .andExpect(jsonPath("$[0].projection.projectedReadiness", is(68)))
                .andExpect(jsonPath("$[0].adjustment.title", is("Zdejmij intensywność")))
                .andExpect(jsonPath("$[0].execution.label", is("Trafiony bodziec")))
                .andExpect(jsonPath("$[0].execution.score", is(92)));
    }

    @Test
    void generatePlan_returns201() throws Exception {
        TrainingPlanProgramDto dto = new TrainingPlanProgramDto(
                UUID.randomUUID(),
                "BUILD_BASE 4w",
                "BUILD_BASE",
                "A",
                LocalDate.of(2025, 1, 6),
                LocalDate.of(2025, 2, 2),
                LocalDate.of(2025, 2, 2),
                LocalDate.of(2025, 1, 20),
                List.of(new TrainingWeekObjectiveDto(
                        LocalDate.of(2025, 1, 6),
                        LocalDate.of(2025, 1, 12),
                        "BASE_ENDURANCE",
                        "Budowa bazy",
                        "Długi tlen i kontrola akcentu",
                        BigDecimal.valueOf(380),
                        1,
                        List.of("ENDURANCE", "TEMPO"),
                        "Dowóz na długi tlen",
                        "Najwięcej węgli zaplanuj pod długi tlen i jedyny akcent tygodnia; lekkie dni bez dodatkowego ładowania.")),
                List.of(TrainingGoalScorecardDto.builder()
                        .weekStart(LocalDate.of(2025, 1, 6))
                        .weekEnd(LocalDate.of(2025, 1, 12))
                        .label("Budowa bazy")
                        .plannedTss(BigDecimal.valueOf(380))
                        .actualTss(BigDecimal.valueOf(360))
                        .plannedQualityDays(1)
                        .completedQualityDays(1)
                        .avgExecutionScore(88)
                        .onTrack(true)
                        .build()),
                BigDecimal.valueOf(400),
                null,
                75,
                180,
                "SUNDAY",
                "INDOOR_FRIENDLY",
                "auto",
                null
        );

        when(trainingPlanService.generatePlan(any())).thenReturn(dto);

        mockMvc.perform(post("/api/training/programs/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "goal": "BUILD_BASE",
                                "goalPriority": "A",
                                "startDate": "2025-01-06",
                                "eventDate": "2025-02-02",
                                "weeks": 4,
                                "trainingDaysPerWeek": 3,
                                "targetWeeklyTss": 400
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.goal", is("BUILD_BASE")))
                .andExpect(jsonPath("$.goalPriority", is("A")))
                .andExpect(jsonPath("$.eventDate", is("2025-02-02")))
                .andExpect(jsonPath("$.taperStartDate", is("2025-01-20")))
                .andExpect(jsonPath("$.weeklyObjectives[0].objectiveType", is("BASE_ENDURANCE")))
                .andExpect(jsonPath("$.weeklyObjectives[0].maxQualityDays", is(1)))
                .andExpect(jsonPath("$.weeklyObjectives[0].fuelingLabel", is("Dowóz na długi tlen")))
                .andExpect(jsonPath("$.goalScorecards[0].plannedQualityDays", is(1)))
                .andExpect(jsonPath("$.name", is("BUILD_BASE 4w")));
    }

    @Test
    void recordAdjustmentFeedback_returns204() throws Exception {
        mockMvc.perform(post("/api/training/adjustments/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "date": "2025-01-06",
                                "planId": "11111111-1111-1111-1111-111111111111",
                                "suggestionType": "LIGHTEN",
                                "suggestionTitle": "Zdejmij intensywność",
                                "feedback": "ACCEPTED"
                            }
                            """))
                .andExpect(status().isNoContent());

        verify(trainingPlanService).recordAdjustmentFeedback(any(RecordAdjustmentFeedbackRequest.class));
    }
}
