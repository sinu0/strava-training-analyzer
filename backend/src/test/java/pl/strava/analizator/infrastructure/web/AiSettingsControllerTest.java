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

import pl.strava.analizator.application.ai.AiSettingsService;
import pl.strava.analizator.application.dto.AiSettingsDto;

@WebMvcTest(AiSettingsController.class)
@Import({GlobalExceptionHandler.class, AiSettingsControllerTest.TestSecurityConfig.class})
class AiSettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiSettingsService service;

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
    void getReturnsLanguage() throws Exception {
        when(service.getSettings()).thenReturn(AiSettingsDto.builder()
                .language("pl").availableLanguages(List.of("pl", "en")).build());

        mockMvc.perform(get("/api/v2/ai/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("pl"))
                .andExpect(jsonPath("$.availableLanguages[1]").value("en"));
    }

    @Test
    void putUpdatesLanguage() throws Exception {
        when(service.updateSettings(any())).thenReturn(AiSettingsDto.builder()
                .language("en").availableLanguages(List.of("pl", "en")).build());

        mockMvc.perform(put("/api/v2/ai/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"language\":\"en\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("en"));
    }

    @Test
    void putRejectsUnsupportedLanguage() throws Exception {
        when(service.updateSettings(any())).thenThrow(new IllegalArgumentException("Unsupported AI language: de"));

        mockMvc.perform(put("/api/v2/ai/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"language\":\"de\"}"))
                .andExpect(status().isBadRequest());
    }
}
