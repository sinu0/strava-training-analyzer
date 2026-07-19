package pl.strava.analizator.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import pl.strava.analizator.application.UiPreferencesConflictException;
import pl.strava.analizator.application.UiPreferencesService;
import pl.strava.analizator.application.dto.DashboardLayoutDto;
import pl.strava.analizator.application.dto.UiPreferencesDto;

@WebMvcTest(UiPreferencesController.class)
@Import({GlobalExceptionHandler.class, UiPreferencesControllerTest.TestSecurityConfig.class})
class UiPreferencesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UiPreferencesService service;

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Test
    void getReturnsVersionedPreferences() throws Exception {
        when(service.getPreferences()).thenReturn(UiPreferencesDto.builder()
                .schemaVersion(1)
                .revision(0)
                .dashboard(DashboardLayoutDto.builder().widgets(List.of()).build())
                .mobileNavigation(List.of("/", "/activities", "/analytics", "/training"))
                .build());

        mockMvc.perform(get("/api/v2/ui-preferences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schemaVersion").value(1))
                .andExpect(jsonPath("$.revision").value(0))
                .andExpect(jsonPath("$.dashboard.widgets").isArray())
                .andExpect(jsonPath("$.mobileNavigation.length()").value(4));
    }

    @Test
    void putReturnsConflictForStaleRevision() throws Exception {
        when(service.updatePreferences(any(UiPreferencesDto.class)))
                .thenThrow(new UiPreferencesConflictException("aktualna revision 4"));

        mockMvc.perform(put("/api/v2/ui-preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schemaVersion": 1,
                                  "revision": 3,
                                  "dashboard": { "widgets": [] },
                                  "mobileNavigation": ["/", "/activities", "/analytics", "/training"]
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("aktualna revision 4"));
    }
}
