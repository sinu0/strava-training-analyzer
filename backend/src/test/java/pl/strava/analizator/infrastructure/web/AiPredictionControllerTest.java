package pl.strava.analizator.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.application.ai.AiModuleDisabledException;
import pl.strava.analizator.application.ai.AiPredictionService;
import pl.strava.analizator.application.dto.AiModuleStatusDto;
import pl.strava.analizator.application.dto.PredictionRequestDto;
import pl.strava.analizator.application.dto.PredictionResponseDto;

@WebMvcTest(AiPredictionController.class)
@Import(AiPredictionControllerTest.TestSecurityConfig.class)
class AiPredictionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AiPredictionService aiPredictionService;

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
    void predict_happyPath_returns200WithResult() throws Exception {
        PredictionResponseDto response = PredictionResponseDto.builder()
                .id(UUID.randomUUID())
                .predictionType("FTP_PREDICTION")
                .modelId("llama3")
                .providerName("ollama")
                .summary("FTP estimate: 280 W, 4-week prediction: 285 W")
                .detail("Based on training data")
                .structuredData(Map.of("currentFtpEstimate", 280, "confidence", 0.78))
                .confidence(0.78)
                .createdAt(Instant.now())
                .build();

        when(aiPredictionService.predict(any())).thenReturn(response);

        String requestBody = objectMapper.writeValueAsString(
                PredictionRequestDto.builder()
                        .predictionType("FTP_PREDICTION")
                        .build());

        mockMvc.perform(post("/api/ai/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.predictionType").value("FTP_PREDICTION"))
                .andExpect(jsonPath("$.modelId").value("llama3"))
                .andExpect(jsonPath("$.providerName").value("ollama"))
                .andExpect(jsonPath("$.confidence").value(0.78))
                .andExpect(jsonPath("$.summary").value("FTP estimate: 280 W, 4-week prediction: 285 W"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void predict_aiDisabled_returns503() throws Exception {
        when(aiPredictionService.predict(any()))
                .thenThrow(new AiModuleDisabledException("AI module is not enabled."));

        String requestBody = objectMapper.writeValueAsString(
                PredictionRequestDto.builder()
                        .predictionType("FTP_PREDICTION")
                        .build());

        mockMvc.perform(post("/api/ai/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("AI module is not enabled."));
    }

    @Test
    void predict_invalidPredictionType_returns400() throws Exception {
        when(aiPredictionService.predict(any()))
                .thenThrow(new IllegalArgumentException("No enum constant INVALID"));

        String requestBody = objectMapper.writeValueAsString(
                PredictionRequestDto.builder()
                        .predictionType("INVALID")
                        .build());

        mockMvc.perform(post("/api/ai/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void getStatus_returns200WithModuleStatus() throws Exception {
        AiModuleStatusDto statusDto = AiModuleStatusDto.builder()
                .enabled(true)
                .batchEnabled(true)
                .batchCron("0 0 3 * * *")
                .todayTipsReady(true)
                .activeProvider("ollama")
                .activeModel("llama3")
                .modelAvailable(true)
                .availableProviders(List.of("ollama"))
                .availablePredictionTypes(List.of("FTP_PREDICTION", "FATIGUE_PREDICTION"))
                .build();

        when(aiPredictionService.getStatus()).thenReturn(statusDto);

        mockMvc.perform(get("/api/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.batchEnabled").value(true))
                .andExpect(jsonPath("$.batchCron").value("0 0 3 * * *"))
                .andExpect(jsonPath("$.todayTipsReady").value(true))
                .andExpect(jsonPath("$.activeProvider").value("ollama"))
                .andExpect(jsonPath("$.activeModel").value("llama3"))
                .andExpect(jsonPath("$.modelAvailable").value(true))
                .andExpect(jsonPath("$.availableProviders[0]").value("ollama"))
                .andExpect(jsonPath("$.availablePredictionTypes").isArray());
    }

    @Test
    void getStatus_disabled_returnsDisabledStatus() throws Exception {
        AiModuleStatusDto statusDto = AiModuleStatusDto.builder()
                .enabled(false)
                .batchEnabled(false)
                .batchCron("0 0 3 * * *")
                .todayTipsReady(false)
                .activeProvider("ollama")
                .activeModel("llama3")
                .modelAvailable(false)
                .availableProviders(List.of())
                .availablePredictionTypes(List.of())
                .build();

        when(aiPredictionService.getStatus()).thenReturn(statusDto);

        mockMvc.perform(get("/api/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.batchEnabled").value(false))
                .andExpect(jsonPath("$.modelAvailable").value(false));
    }

}
