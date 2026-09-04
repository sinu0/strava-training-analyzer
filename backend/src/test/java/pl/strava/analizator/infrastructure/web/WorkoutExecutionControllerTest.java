package pl.strava.analizator.infrastructure.web;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.WorkoutActivityMatchingService;
import pl.strava.analizator.application.WorkoutExecutionService;
import pl.strava.analizator.application.WorkoutExportService;
import pl.strava.analizator.domain.model.WorkoutDeliveryCapability;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutDeliveryPort;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

@WebMvcTest(WorkoutExecutionController.class)
@Import(SecurityConfig.class)
class WorkoutExecutionControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean WorkoutExecutionService executionService;
    @MockitoBean WorkoutActivityMatchingService matchingService;
    @MockitoBean WorkoutExportService exportService;
    @MockitoBean TrainingPlanRepository trainingPlanRepository;
    @MockitoBean WorkoutDeliveryPort deliveryPort;
    @MockitoBean Clock clock;

    @Test
    void startContractIsIdempotencyKeyBasedAndReturnsSnapshot() throws Exception {
        UUID planId = UUID.randomUUID();
        Instant at = Instant.parse("2026-09-03T18:00:00Z");
        WorkoutExecution execution = execution(planId, at);
        when(executionService.start(eq(planId), eq("start-1"), eq(at), eq("ON_DEVICE")))
                .thenReturn(execution);

        mockMvc.perform(post("/api/v2/workouts/scheduled/{id}/executions/start", planId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idempotencyKey":"start-1","occurredAt":"2026-09-03T18:00:00Z","deliveryMethod":"ON_DEVICE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.stepsSnapshot", hasSize(1)))
                .andExpect(jsonPath("$.ftpWatts").value(280));
    }

    @Test
    void noActiveExecutionUsesNoContentInsteadOfFakeState() throws Exception {
        when(executionService.active()).thenReturn(null);
        mockMvc.perform(get("/api/v2/workouts/executions/active"))
                .andExpect(status().isNoContent());
    }

    @Test
    void scheduledFitExportHasDownloadContract() throws Exception {
        UUID planId = UUID.randomUUID();
        when(exportService.exportScheduledAsFit(planId)).thenReturn(new byte[]{1, 2, 3});
        mockMvc.perform(get("/api/v2/workouts/scheduled/{id}/export/fit", planId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"scheduled-workout.fit\""))
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_OCTET_STREAM_VALUE));
    }

    @Test
    void capabilitiesExplicitlyExposeUnavailableGarmin() throws Exception {
        when(deliveryPort.capabilities()).thenReturn(List.of(
                new WorkoutDeliveryCapability("DOWNLOAD_FIT", "AVAILABLE", null),
                new WorkoutDeliveryCapability("GARMIN", "UNAVAILABLE", "Wymaga programu")));
        mockMvc.perform(get("/api/v2/workouts/delivery-capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1].method").value("GARMIN"))
                .andExpect(jsonPath("$[1].status").value("UNAVAILABLE"));
    }

    private WorkoutExecution execution(UUID planId, Instant at) {
        return WorkoutExecution.builder().id(UUID.randomUUID()).scheduledWorkoutId(planId)
                .workoutNameSnapshot("Test").stepsSnapshot(List.of(
                        WorkoutStep.builder().type("steady").durationSec(60).build()))
                .ftpWatts(280).startedAt(at).status(WorkoutExecutionStatus.RUNNING)
                .runningSince(at).skippedStepIndexes(List.of()).repeatedStepIndexes(List.of())
                .activityMatchStatus("PENDING").complianceStatus("UNKNOWN")
                .complianceAlgorithmVersion("workout-compliance-v1")
                .deliveryMethod("ON_DEVICE").createdAt(at).updatedAt(at).build();
    }
}
