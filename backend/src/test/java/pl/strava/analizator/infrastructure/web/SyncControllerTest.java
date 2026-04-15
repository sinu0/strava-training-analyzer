package pl.strava.analizator.infrastructure.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.DailyMetricsService;
import pl.strava.analizator.application.SyncService;

@WebMvcTest(SyncController.class)
@Import(SyncControllerTest.TestSecurityConfig.class)
class SyncControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SyncService syncService;

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
    void fullSyncReturns202() throws Exception {
        SyncService.SyncStatus status = new SyncService.SyncStatus(
                "completed", Instant.now(), 50, 2, null);
        when(syncService.syncFull()).thenReturn(status);

        mockMvc.perform(post("/api/sync/strava/full"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.imported").value(50));
    }

    @Test
    void recentSyncReturns202() throws Exception {
        SyncService.SyncStatus status = new SyncService.SyncStatus(
                "completed", Instant.now(), 5, 0, null);
        when(syncService.syncRecent()).thenReturn(status);

        mockMvc.perform(post("/api/sync/strava/recent"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("completed"));
    }

    @Test
    void photoSyncReturns202() throws Exception {
        SyncService.SyncStatus status = new SyncService.SyncStatus(
                "completed", Instant.now(), 12, 4, null);
        when(syncService.syncActivityPhotos()).thenReturn(status);

        mockMvc.perform(post("/api/sync/strava/photos"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.imported").value(12))
                .andExpect(jsonPath("$.skipped").value(4));
    }

    @Test
    void syncStatusReturnsCurrentStatus() throws Exception {
        SyncService.SyncStatus status = new SyncService.SyncStatus(
                "idle", null, 0, 0, null);
        when(syncService.getLastSyncStatus()).thenReturn(status);

        mockMvc.perform(get("/api/sync/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("idle"));
    }
}
