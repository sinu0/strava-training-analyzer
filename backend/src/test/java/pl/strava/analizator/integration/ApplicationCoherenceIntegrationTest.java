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
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.CoachingFeedback;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.CoachingFeedbackRepository;

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

    @Test void migratesAndExportsRealOpenApi() throws Exception {
        assertThat(jdbc.queryForObject("SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1", String.class)).isEqualTo("55");
        String schema = mvc.perform(get("/api-docs")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(schema).at("/paths/~1api~1v2~1training~1context").isMissingNode()).isFalse();
        Files.createDirectories(Path.of("build"));
        Files.writeString(Path.of("build/openapi.json"), schema);
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
}
