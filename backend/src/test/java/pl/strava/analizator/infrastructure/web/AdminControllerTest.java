package pl.strava.analizator.infrastructure.web;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.DailyMetricsService;
import pl.strava.analizator.application.HeatmapBuildService;
import pl.strava.analizator.application.StravaConfigPort;
import pl.strava.analizator.application.dto.StravaConfigDto;
import pl.strava.analizator.infrastructure.weather.WeatherCacheScheduler;

@WebMvcTest(AdminController.class)
@Import(AdminControllerTest.TestSecurityConfig.class)
@SuppressWarnings("null")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StravaConfigPort stravaConfigPort;

    @MockitoBean
    private WeatherCacheScheduler weatherCacheScheduler;

    @MockitoBean
    private HeatmapBuildService heatmapBuildService;

    @MockitoBean
    private DailyMetricsService dailyMetricsService;

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Test
    void getStravaConfigReturnsCurrentValues() throws Exception {
        when(stravaConfigPort.getCurrentConfig()).thenReturn(new StravaConfigDto(
                "12345",
                "env",
                true,
                "db",
                false,
                "env"
        ));

        mockMvc.perform(get("/api/admin/strava-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value("12345"))
                .andExpect(jsonPath("$.clientIdSource").value("env"))
                .andExpect(jsonPath("$.hasClientSecret").value(true))
                .andExpect(jsonPath("$.clientSecretSource").value("db"))
                .andExpect(jsonPath("$.hasWebhookToken").value(false))
                .andExpect(jsonPath("$.webhookTokenSource").value("env"));
    }

    @Test
    void updateStravaConfigSavesRequestBodyAndReturnsUpdatedValues() throws Exception {
        doNothing().when(stravaConfigPort).saveConfig(anyString(), anyString(), anyString());
        when(stravaConfigPort.getCurrentConfig()).thenReturn(new StravaConfigDto(
                "67890",
                "db",
                true,
                "db",
                true,
                "db"
        ));

        mockMvc.perform(put("/api/admin/strava-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientId": "67890",
                                  "clientSecret": "secret-xyz",
                                  "webhookToken": "verify-123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value("67890"))
                .andExpect(jsonPath("$.clientIdSource").value("db"))
                .andExpect(jsonPath("$.hasClientSecret").value(true))
                .andExpect(jsonPath("$.hasWebhookToken").value(true));

        verify(stravaConfigPort).saveConfig("67890", "secret-xyz", "verify-123");
    }

    @Test
    void updateStravaConfigAllowsPartialUpdates() throws Exception {
        doNothing().when(stravaConfigPort).saveConfig(anyString(), isNull(), isNull());
        when(stravaConfigPort.getCurrentConfig()).thenReturn(new StravaConfigDto(
                "99999",
                "db",
                false,
                "env",
                false,
                "env"
        ));

        mockMvc.perform(put("/api/admin/strava-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientId": "99999"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value("99999"))
                .andExpect(jsonPath("$.hasClientSecret").value(false));

        verify(stravaConfigPort).saveConfig("99999", null, null);
    }

    @Test
    void resetStravaConfigClearsOverridesAndReturnsFallbackValues() throws Exception {
        doNothing().when(stravaConfigPort).clearConfig();
        when(stravaConfigPort.getCurrentConfig()).thenReturn(new StravaConfigDto(
                "12345",
                "env",
                true,
                "env",
                true,
                "env"
        ));

        mockMvc.perform(delete("/api/admin/strava-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value("12345"))
                .andExpect(jsonPath("$.clientIdSource").value("env"))
                .andExpect(jsonPath("$.clientSecretSource").value("env"))
                .andExpect(jsonPath("$.webhookTokenSource").value("env"));

        verify(stravaConfigPort).clearConfig();
    }

    @Test
    void getWeatherJobStatusReturnsSchedulerState() throws Exception {
        when(weatherCacheScheduler.getLastJobStatus()).thenReturn(
                new WeatherCacheScheduler.JobStatus(
                        "partial_failure",
                        Instant.parse("2026-03-27T20:15:00Z"),
                        3,
                        1,
                        "Zakopane: timeout"
                )
        );

        mockMvc.perform(get("/api/admin/weather-job-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("partial_failure"))
                .andExpect(jsonPath("$.locationsProcessed").value(3))
                .andExpect(jsonPath("$.locationsFailed").value(1))
                .andExpect(jsonPath("$.errorMessage").value("Zakopane: timeout"));
    }
}