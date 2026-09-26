package pl.strava.analizator.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexEntry;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.CoachingFeedback;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.CoachingFeedbackRepository;
import pl.strava.analizator.domain.port.UiPreferencesRepository;
import pl.strava.analizator.domain.port.RideRecordingRepository;
import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.model.DashboardWidget;
import pl.strava.analizator.domain.model.UiPreferences;

@Tag("integration")
@Testcontainers
@SpringBootTest(properties = {"app.scheduling.enabled=false", "ai.enabled=false", "logging.level.pl.strava.analizator=INFO"})
@AutoConfigureMockMvc
@Import(ApplicationCoherenceIntegrationTest.TimeConfig.class)
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@RequiredArgsConstructor
class ApplicationCoherenceIntegrationTest {
    @Container static final PostgreSQLContainer<?> database = new PostgreSQLContainer<>(DockerImageName.parse(
            System.getenv().getOrDefault("TEST_DATABASE_IMAGE", "stravaanalizator-db:latest")).asCompatibleSubstituteFor("postgres"));

    @DynamicPropertySource static void databaseProperties(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", database::getJdbcUrl);
        properties.add("spring.datasource.username", database::getUsername);
        properties.add("spring.datasource.password", database::getPassword);
    }

    @TestConfiguration static class TimeConfig {
        @Bean @Primary Clock testClock() { return Clock.fixed(Instant.parse("2026-09-04T22:30:00Z"), ZoneId.of("Europe/Warsaw")); }
    }

    private final MockMvc mvc;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private final ActivityRepository activities;
    private final CoachingFeedbackRepository feedback;
    private final KnowledgeIndexPort knowledgeIndex;
    private final UiPreferencesRepository uiPreferences;
    private final RideRecordingRepository rideRecordings;

    @Test void migratesAndExportsRealOpenApi() throws Exception {
        assertThat(jdbc.queryForObject("SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("64");
        String schema = mvc.perform(get("/api-docs")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(schema).at("/paths/~1api~1v2~1training~1context").isMissingNode()).isFalse();
        Files.createDirectories(Path.of("build"));
        Files.writeString(Path.of("build/openapi.json"), schema);
    }

    @Test void aiLanguagePreferencePersistsAndRejectsUnsupportedValue() throws Exception {
        mvc.perform(get("/api/v2/ai/settings")).andExpect(status().isOk()).andExpect(jsonPath("$.language").value("pl"));
        mvc.perform(put("/api/v2/ai/settings").contentType(MediaType.APPLICATION_JSON).content("{\"language\":\"en\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.language").value("en"));
        assertThat(jdbc.queryForObject("SELECT language FROM ai_settings WHERE id = 1", String.class)).isEqualTo("en");
        mvc.perform(put("/api/v2/ai/settings").contentType(MediaType.APPLICATION_JSON).content("{\"coachingStyle\":\"AGGRESSIVE_COACH\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.language").value("en"))
                .andExpect(jsonPath("$.coachingStyle").value("AGGRESSIVE_COACH"));
        mvc.perform(put("/api/v2/ai/settings").contentType(MediaType.APPLICATION_JSON).content("{\"language\":\"de\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v2/ai/settings").contentType(MediaType.APPLICATION_JSON).content("{\"language\":\"pl\"}"))
                .andExpect(status().isOk());
    }

    @Test void contextPersistsAcrossRequestsAndRejectsStaleRevision() throws Exception {
        String initial = mvc.perform(get("/api/v2/training/context"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.timezone").value("Europe/Warsaw"))
                .andExpect(jsonPath("$.asOf").value("2026-09-05")).andReturn().getResponse().getContentAsString();
        var request = (com.fasterxml.jackson.databind.node.ObjectNode) json.readTree(initial);
        request.put("goalType", "CONSISTENCY");
        request.withObject("availableMinutes").put("SATURDAY", 60);
        String body = json.writeValueAsString(request);
        mvc.perform(put("/api/v2/training/context").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
        mvc.perform(get("/api/v2/training/context")).andExpect(jsonPath("$.availableMinutes.SATURDAY").value(60));
        mvc.perform(put("/api/v2/training/context").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test void emptyDatabaseDoesNotProduceFabricatedTrainingLoad() throws Exception {
        mvc.perform(get("/api/v2/analytics/load").param("from", "2026-09-01").param("to", "2026-09-05"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.availability").value("UNKNOWN"));
        mvc.perform(get("/api/v2/today")).andExpect(status().isOk()).andExpect(jsonPath("$.asOf").value("2026-09-05"));
    }

    @Test void activityProvenanceAndHalfOpenCalendarBoundarySurviveRoundTrip() {
        OffsetDateTime start = OffsetDateTime.parse("2025-01-05T23:00:00Z");
        Activity activity = activities.save(Activity.builder().source("integration").sportType("Ride")
                .externalId(UUID.randomUUID().toString()).name("Measured power")
                .startedAt(start).deviceWatts(false).build());
        assertThat(activities.findById(activity.getId()).orElseThrow().getDeviceWatts()).isFalse();
        assertThat(activities.findByStartedAtBetween(start.minusDays(1), start)).isEmpty();
        assertThat(activities.findByStartedAtBetween(start, start.plusDays(1))).extracting(Activity::getId).contains(activity.getId());
    }

    @Test void feedbackUpsertIsDurableAndIdempotent() {
        Instant at = Instant.parse("2026-09-03T10:00:00Z");
        String key = "execution:" + UUID.randomUUID();
        feedback.save(CoachingFeedback.builder().id(UUID.randomUUID()).sourceKey(key).occurredAt(at).sessionType("ENDURANCE").rpe(5).completed(true).build());
        feedback.save(CoachingFeedback.builder().id(UUID.randomUUID()).sourceKey(key).occurredAt(at).sessionType("ENDURANCE").rpe(8).completed(true).build());
        assertThat(feedback.findBetween(at, at.plusSeconds(1))).hasSize(1).allSatisfy(f -> assertThat(f.getRpe()).isEqualTo(8));
    }

    @Test void knowledgeCorpusReplacementIsAtomicAndVersioned() {
        jdbc.update("DELETE FROM ai_knowledge_documents");
        knowledgeIndex.replaceAll(List.of(knowledgeEntry("old-version", "old-content", 384)));

        assertThat(knowledgeIndex.currentCorpusVersion()).contains("old-version");
        assertThat(knowledgeIndex.count()).isEqualTo(1);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> knowledgeIndex.replaceAll(List.of(
                knowledgeEntry("new-version", "new-content", 2))))
                .isInstanceOf(RuntimeException.class);

        assertThat(knowledgeIndex.currentCorpusVersion()).contains("old-version");
        assertThat(knowledgeIndex.count()).isEqualTo(1);
    }

    @Test void databasePreventsParallelUnfinishedJobsOfTheSameType() {
        String jobType = "INTEGRATION_LOCK";
        jdbc.update("INSERT INTO processing_jobs (job_type, mode, stage, status) VALUES (?, 'ALL', 'FETCH_SUMMARY', 'RETRYABLE')", jobType);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(
                        "INSERT INTO processing_jobs (job_type, mode, stage, status) VALUES (?, 'ALL', 'FETCH_DETAIL', 'QUEUED')",
                        jobType))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);

        jdbc.update("DELETE FROM processing_jobs WHERE job_type = ?", jobType);
    }

    @Test void persistsDashboardPreferencesAsJsonb() {
        UiPreferences saved = uiPreferences.save(UiPreferences.defaults().toBuilder()
                .revision(3)
                .widgets(List.of(DashboardWidget.builder().id("load-main").type("load").order(0).span(6)
                        .settings(java.util.Map.of("range", 42)).build()))
                .build());

        assertThat(saved.getRevision()).isEqualTo(3);
        UiPreferences reloaded = uiPreferences.find().orElseThrow();
        assertThat(reloaded.getWidgets()).singleElement().satisfies(widget -> {
            assertThat(widget.getId()).isEqualTo("load-main");
            assertThat(widget.getSettings()).containsEntry("range", 42);
        });
        assertThat(jdbc.queryForObject("SELECT jsonb_typeof(dashboard_json) FROM ui_preferences", String.class)).isEqualTo("array");
    }

    @Test void storesRideRecordingChunksIdempotentlyAndCascadesWithExecution() {
        UUID plan = jdbc.queryForObject("INSERT INTO training_plans (date) VALUES (DATE '2026-09-24') RETURNING id", UUID.class);
        UUID execution = jdbc.queryForObject("""
                INSERT INTO workout_executions (training_plan_id, workout_name_snapshot, workout_steps_snapshot, started_at, status, start_idempotency_key)
                VALUES (?, 'Próg', '[]'::jsonb, NOW(), 'RUNNING', ?) RETURNING id
                """, UUID.class, plan, "ride-" + UUID.randomUUID());
        Instant start = Instant.parse("2026-09-24T17:00:00Z");
        RideSample first = RideSample.builder().at(start).elapsedMs(0).stepIndex(0).powerWatts(200).heartRateBpm(130).cadenceRpm(90).speedKph(33.3).build();
        RideSample second = RideSample.builder().at(start.plusSeconds(1)).elapsedMs(1000).stepIndex(0).powerWatts(205).build();

        rideRecordings.saveChunk(execution, 1, List.of(second));
        rideRecordings.saveChunk(execution, 0, List.of(first));
        rideRecordings.saveChunk(execution, 0, List.of(first));

        assertThat(rideRecordings.findByExecution(execution)).containsExactly(first, second);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM workout_execution_sample_chunks WHERE execution_id = ?", Integer.class, execution)).isEqualTo(2);
        jdbc.update("DELETE FROM workout_executions WHERE id = ?", execution);
        assertThat(rideRecordings.findByExecution(execution)).isEmpty();
        jdbc.update("DELETE FROM training_plans WHERE id = ?", plan);
    }

    private KnowledgeIndexEntry knowledgeEntry(String version, String content, int dimensions) {
        return new KnowledgeIndexEntry(
                KnowledgeDocument.builder()
                        .source(KnowledgeSource.CUSTOM)
                        .url("https://example.test/" + version)
                        .title(version)
                        .type(KnowledgeType.SCIENTIFIC)
                        .topics(List.of("training"))
                        .content(content)
                        .chunkIndex(0)
                        .contentHash("a".repeat(64))
                        .corpusVersion(version)
                        .build(),
                new float[dimensions]);
    }
}
