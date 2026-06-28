package pl.strava.analizator.infrastructure.web.v2;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.ai.AiPredictionServiceV2;
import pl.strava.analizator.application.dto.CompareRequestDto;
import pl.strava.analizator.application.dto.PredictionResponseV2Dto;

@WebMvcTest(AiV2Controller.class)
@TestPropertySource(properties = "ai.enabled=true")
class AiV2ControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AiPredictionServiceV2 predictionServiceV2;

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http.csrf(c -> c.disable()).authorizeHttpRequests(a -> a.anyRequest().permitAll());
            return http.build();
        }
    }

    @Test
    void predict_validRequest_returnsPrediction() throws Exception {
        PredictionResponseV2Dto response = PredictionResponseV2Dto.builder()
                .id("id-1")
                .type("FTP_PREDICTION")
                .modelId("qwen3.6:27b")
                .summary("FTP estimate 290W")
                .insight("CTL rising")
                .confidence(0.8)
                .metrics(Map.of("currentFTP", "280W"))
                .build();

        when(predictionServiceV2.predict(any())).thenReturn(response);

        mockMvc.perform(post("/api/v2/ai/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predictionType\":\"FTP_PREDICTION\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary", is("FTP estimate 290W")))
                .andExpect(jsonPath("$.type", is("FTP_PREDICTION")))
                .andExpect(jsonPath("$.confidence", is(0.8)));
    }

    @Test
    void compare_returnsList() throws Exception {
        PredictionResponseV2Dto r1 = PredictionResponseV2Dto.builder()
                .id("id-1").type("FTP_PREDICTION").summary("Model A").modelId("qwen3.6:27b").build();
        PredictionResponseV2Dto r2 = PredictionResponseV2Dto.builder()
                .id("id-2").type("FTP_PREDICTION").summary("Model B").modelId("deepseek-r1:14b").build();

        when(predictionServiceV2.compare(any(CompareRequestDto.class))).thenReturn(List.of(r1, r2));

        mockMvc.perform(post("/api/v2/ai/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predictionType\":\"FTP_PREDICTION\",\"models\":[\"qwen3.6:27b\",\"deepseek-r1:14b\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].summary", is("Model A")));
    }

    @Test
    void models_returnsAvailableModels() throws Exception {
        when(predictionServiceV2.getAvailableModels())
                .thenReturn(Map.of("primary", "qwen3.6:27b", "available", true));

        mockMvc.perform(get("/api/v2/ai/models"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primary", is("qwen3.6:27b")));
    }

    @Test
    void knowledgeStatus_returnsStatus() throws Exception {
        when(predictionServiceV2.getKnowledgeStatus())
                .thenReturn(Map.of("ragAvailable", false, "refreshScheduled", "0 0 2 * * 0"));

        mockMvc.perform(get("/api/v2/ai/knowledge/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ragAvailable", is(false)));
    }

    @Test
    void knowledgeRefresh_returnsResult() throws Exception {
        when(predictionServiceV2.refreshKnowledge())
                .thenReturn(Map.of("status", "completed", "documentsIndexed", 42));

        mockMvc.perform(post("/api/v2/ai/knowledge/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("completed")));
    }

    @Test
    void history_returnsList() throws Exception {
        PredictionResponseV2Dto r1 = PredictionResponseV2Dto.builder()
                .id("id-1").type("FTP_PREDICTION").summary("Old prediction").modelId("qwen3.6:27b").build();

        when(predictionServiceV2.getHistory(null, 20)).thenReturn(List.of(r1));

        mockMvc.perform(get("/api/v2/ai/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
