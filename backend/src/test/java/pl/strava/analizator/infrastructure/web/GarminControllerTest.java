package pl.strava.analizator.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

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

import pl.strava.analizator.application.GarminSyncService;
import pl.strava.analizator.application.dto.GarminHealthImportDayDto;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.infrastructure.config.EncryptionUtil;

@WebMvcTest(GarminController.class)
@Import(GarminControllerTest.TestSecurityConfig.class)
@SuppressWarnings("null")
class GarminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GarminSyncService garminSyncService;

    @MockitoBean
    private DailySummaryRepository dailySummaryRepository;

    @MockitoBean
    private EncryptionUtil encryptionUtil;

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
    void importHealthDataDelegatesToSyncService() throws Exception {
        GarminSyncService.SyncResult result = new GarminSyncService.SyncResult(2, 0, 0, List.of());
        when(garminSyncService.importHealthData(any())).thenReturn(result);

        mockMvc.perform(post("/api/garmin/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "days": [
                                    {
                                      "date": "2026-04-25",
                                      "restingHrBpm": 49,
                                      "hrvRmssd": 51.4,
                                      "sleepScore": 83,
                                      "bodyBattery": 78,
                                      "stressAvg": 22,
                                      "sleepDurationSeconds": 28200,
                                      "steps": 11000,
                                      "activeCalories": 530,
                                      "deepSleepSeconds": 7200,
                                      "lightSleepSeconds": 13000,
                                      "remSleepSeconds": 6200,
                                      "awakeSleepSeconds": 1800,
                                      "syncedAt": "2026-04-26T22:10:00Z"
                                    },
                                    {
                                      "date": "2026-04-26",
                                      "restingHrBpm": 50,
                                      "steps": 9500
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.synced").value(2))
                .andExpect(jsonPath("$.failed").value(0));

        verify(garminSyncService).importHealthData(List.of(
                new GarminHealthImportDayDto(
                        LocalDate.parse("2026-04-25"),
                        (short) 49,
                        new BigDecimal("51.4"),
                        (short) 83,
                        (short) 78,
                        (short) 22,
                        28200,
                        11000,
                        530,
                        7200,
                        13000,
                        6200,
                        1800,
                        Instant.parse("2026-04-26T22:10:00Z")),
                new GarminHealthImportDayDto(
                        LocalDate.parse("2026-04-26"),
                        (short) 50,
                        null,
                        null,
                        null,
                        null,
                        null,
                        9500,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null)));
    }
}
