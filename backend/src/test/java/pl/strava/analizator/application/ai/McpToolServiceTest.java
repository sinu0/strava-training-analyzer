package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.ToolCall;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AiSqlQueryPort;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.model.Activity;

@ExtendWith(MockitoExtension.class)
class McpToolServiceTest {

    @Mock private AthleteProfileRepository athleteProfileRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private DailyMetricRepository dailyMetricRepository;
    @Mock private AiSqlQueryPort aiSqlQueryPort;

    private McpToolService service;

    @BeforeEach
    void setUp() {
        service = new McpToolService(athleteProfileRepository, activityRepository, dailyMetricRepository, aiSqlQueryPort);
    }

    @Test
    void getToolDefinitions_includesSchemaAndSqlTools() {
        List<AiTool> tools = service.getToolDefinitions();

        assertThat(tools).extracting(AiTool::name)
                .contains("describe_training_database_schema", "query_training_database");
    }

    @Test
    void execute_queryTrainingDatabase_usesReadOnlyPort() {
        when(aiSqlQueryPort.executeReadOnlySql(eq("select id from activities"), anyInt()))
                .thenReturn("{\"rows\":[]}");

        var result = service.execute(new ToolCall("1", "query_training_database",
                Map.of("sql", "select id from activities", "max_rows", 25)), null);

        assertThat(result.content()).isEqualTo("{\"rows\":[]}");
    }

    @Test
    void execute_describeTrainingDatabaseSchema_returnsSchemaSummary() {
        when(aiSqlQueryPort.describeSchema()).thenReturn("activities(id uuid, started_at timestamptz)");

        var result = service.execute(new ToolCall("1", "describe_training_database_schema", Map.of()), null);

        assertThat(result.content()).contains("activities");
    }

    @Test
    void execute_getRecentActivities_includesRecencyLabel() {
        UUID activityId = UUID.randomUUID();
        OffsetDateTime startedAt = OffsetDateTime.now(ZoneOffset.UTC).minusDays(4);
        when(activityRepository.findByStartedAtBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(Activity.builder()
                        .id(activityId)
                        .startedAt(startedAt)
                        .sportType("Ride")
                        .name("Morning Ride")
                        .movingTimeSec(3600)
                        .build()));

        var result = service.execute(new ToolCall("1", "get_recent_activities", Map.of("days", 14)), null);

        assertThat(result.content()).contains("4d ago");
        assertThat(result.content()).contains("Morning Ride");
    }

    @Test
    void execute_getWeeklyStats_includesTssColumn() {
        OffsetDateTime startedAt = OffsetDateTime.now(ZoneOffset.UTC).minusDays(2);
        when(activityRepository.findByStartedAtBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(Activity.builder()
                        .id(UUID.randomUUID())
                        .startedAt(startedAt)
                        .sportType("Ride")
                        .movingTimeSec(5400)
                        .distanceM(BigDecimal.valueOf(40000))
                        .build()));

        TreeMap<java.time.LocalDate, BigDecimal> dailyTss = new TreeMap<>();
        dailyTss.put(startedAt.toLocalDate(), BigDecimal.valueOf(88));
        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), org.mockito.ArgumentMatchers.any()))
                .thenReturn(dailyTss);

        var result = service.execute(new ToolCall("1", "get_weekly_stats", Map.of("weeks", 2)), null);

        assertThat(result.content()).contains("TSS");
        assertThat(result.content()).containsPattern("88[,.]0");
    }
}
