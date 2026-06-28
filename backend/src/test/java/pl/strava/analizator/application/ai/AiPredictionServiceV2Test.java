package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.application.ai.knowledge.KnowledgeBaseBuilder;
import pl.strava.analizator.application.ai.knowledge.RagServiceV2;
import pl.strava.analizator.application.ai.mcp.ToolCallingLoopV2;
import pl.strava.analizator.application.dto.CompareRequestDto;
import pl.strava.analizator.application.dto.PredictionRequestV2Dto;
import pl.strava.analizator.application.dto.PredictionResponseV2Dto;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.ai.ModelCapability;
import pl.strava.analizator.domain.ai.ModelTier;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.TrainingContext;
import pl.strava.analizator.domain.port.AiPredictionRepository;

@ExtendWith(MockitoExtension.class)
class AiPredictionServiceV2Test {

    @Mock private PromptEngine promptEngine;
    @Mock private TrainingDataAdapter trainingDataAdapter;
    @Mock private ModelCapabilityMatrix modelCapabilityMatrix;
    @Mock private LlmProviderRegistry providerRegistry;
    @Mock private ToolCallingLoopV2 toolCallingLoopV2;
    @Mock private RagServiceV2 ragServiceV2;
    @Mock private ResponseValidator responseValidator;
    @Mock private KnowledgeBaseBuilder knowledgeBaseBuilder;
    @Mock private AiPredictionRepository predictionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private AiPredictionServiceV2 service;

    @BeforeEach
    void setUp() {
        service = new AiPredictionServiceV2(
                promptEngine, trainingDataAdapter, modelCapabilityMatrix,
                providerRegistry, toolCallingLoopV2, ragServiceV2,
                responseValidator, knowledgeBaseBuilder, predictionRepository,
                objectMapper);
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "defaultProvider", "ollama-v2");
        ReflectionTestUtils.setField(service, "defaultModel", "qwen3.6:27b");

        lenient().when(trainingDataAdapter.getDaysBack(any())).thenReturn(30);
        lenient().when(responseValidator.validate(anyString()))
                .thenReturn(new ResponseValidator.ValidationResult(true, false, ""));
    }

    @Test
    void predict_disabled_throws() {
        ReflectionTestUtils.setField(service, "enabled", false);
        PredictionRequestV2Dto req = PredictionRequestV2Dto.builder()
                .predictionType("FTP_PREDICTION").build();

        assertThatThrownBy(() -> service.predict(req))
                .isInstanceOf(AiModuleDisabledException.class);
    }

    @Test
    void predict_validRequest_returnsPrediction() {
        TrainingContext ctx = buildMockContext();
        when(trainingDataAdapter.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(ctx);
        when(promptEngine.buildPrompt(eq(PredictionType.FTP_PREDICTION), any(), any(), any()))
                .thenReturn(new PromptResult("sys prompt", "user prompt", PredictionType.FTP_PREDICTION));
        when(providerRegistry.hasProvider("ollama-v2")).thenReturn(true);
        when(modelCapabilityMatrix.resolve("qwen3.6:27b"))
                .thenReturn(Optional.of(new ModelCapability("qwen3.6:27b", ModelTier.PRIMARY, true, true, true, 262144, 1)));
        when(toolCallingLoopV2.run(anyString(), anyString(), eq(null), anyString(), anyString(), any()))
                .thenReturn(new ToolCallingLoopV2.ToolLoopResult(null, List.of(),
                        "{\"summary\":\"FTP estimate 290W\",\"insight\":\"CTL rising\",\"action\":\"Test in 7 days\",\"metrics\":{\"currentFTP\":\"280W\"},\"confidence\":0.8,\"reasoning\":\"step by step\"}"));
        when(ragServiceV2.isAvailable()).thenReturn(false);

        PredictionRequestV2Dto req = PredictionRequestV2Dto.builder()
                .predictionType("FTP_PREDICTION").build();

        PredictionResponseV2Dto result = service.predict(req);

        assertThat(result.getSummary()).isEqualTo("FTP estimate 290W");
        assertThat(result.getConfidence()).isEqualTo(0.8);
        assertThat(result.getType()).isEqualTo("FTP_PREDICTION");
        assertThat(result.getModelId()).isEqualTo("qwen3.6:27b");
    }

    @Test
    void predict_withPersona_passesToPromptEngine() {
        TrainingContext ctx = buildMockContext();
        when(trainingDataAdapter.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(ctx);
        when(promptEngine.buildPrompt(eq(PredictionType.FTP_PREDICTION), any(), any(), any()))
                .thenReturn(new PromptResult("sys", "user", PredictionType.FTP_PREDICTION));
        when(providerRegistry.hasProvider("ollama-v2")).thenReturn(true);
        when(modelCapabilityMatrix.resolve("qwen3.6:27b"))
                .thenReturn(Optional.of(new ModelCapability("qwen3.6:27b", ModelTier.PRIMARY, true, true, true, 262144, 1)));
        when(toolCallingLoopV2.run(anyString(), anyString(), eq(null), anyString(), anyString(), any()))
                .thenReturn(new ToolCallingLoopV2.ToolLoopResult(null, List.of(),
                        "{\"summary\":\"Push harder\",\"insight\":\"Ready\",\"action\":\"Go\",\"metrics\":{},\"confidence\":0.9,\"reasoning\":\"x\"}"));
        when(ragServiceV2.isAvailable()).thenReturn(false);

        PredictionRequestV2Dto req = PredictionRequestV2Dto.builder()
                .predictionType("FTP_PREDICTION")
                .persona("AGGRESSIVE_COACH")
                .build();

        PredictionResponseV2Dto result = service.predict(req);
        assertThat(result.getSummary()).isEqualTo("Push harder");
    }

    @Test
    void compare_multipleModels_returnsList() {
        TrainingContext ctx = buildMockContext();
        when(trainingDataAdapter.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(ctx);
        when(promptEngine.buildPrompt(eq(PredictionType.FTP_PREDICTION), any(), any(), any()))
                .thenReturn(new PromptResult("sys", "user", PredictionType.FTP_PREDICTION));
        when(providerRegistry.hasProvider("ollama-v2")).thenReturn(true);
        when(modelCapabilityMatrix.resolve(anyString()))
                .thenReturn(Optional.of(new ModelCapability("qwen3.6:27b", ModelTier.PRIMARY, true, true, true, 262144, 1)));
        when(toolCallingLoopV2.run(anyString(), anyString(), eq(null), anyString(), anyString(), any()))
                .thenReturn(new ToolCallingLoopV2.ToolLoopResult(null, List.of(),
                        "{\"summary\":\"Test\",\"insight\":\"Insight\",\"action\":\"Act\",\"metrics\":{},\"confidence\":0.7,\"reasoning\":\"r\"}"));
        when(ragServiceV2.isAvailable()).thenReturn(false);

        CompareRequestDto req = CompareRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .models(List.of("qwen3.6:27b", "deepseek-r1:14b"))
                .build();

        List<PredictionResponseV2Dto> results = service.compare(req);
        assertThat(results).hasSize(2);
    }

    @Test
    void getAvailableModels_returnsInfo() {
        when(providerRegistry.getAvailableProviders()).thenReturn(List.of("ollama-v2"));
        Map<String, Object> result = service.getAvailableModels();
        assertThat(result).containsKey("primary");
        assertThat(result).containsKey("providers");
        assertThat(result.get("available")).isEqualTo(true);
    }

    @Test
    void getKnowledgeStatus_returnsInfo() {
        when(ragServiceV2.isAvailable()).thenReturn(false);
        Map<String, Object> result = service.getKnowledgeStatus();
        assertThat(result.get("ragAvailable")).isEqualTo(false);
    }

    @Test
    void refreshKnowledge_success_returnsCount() {
        when(knowledgeBaseBuilder.rebuild()).thenReturn(42);
        Map<String, Object> result = service.refreshKnowledge();
        assertThat(result.get("status")).isEqualTo("completed");
        assertThat(result.get("documentsIndexed")).isEqualTo(42);
    }

    @Test
    void refreshKnowledge_failure_returnsError() {
        when(knowledgeBaseBuilder.rebuild()).thenThrow(new RuntimeException("DB error"));
        Map<String, Object> result = service.refreshKnowledge();
        assertThat(result.get("status")).isEqualTo("failed");
        assertThat(result.get("error")).asString().contains("DB error");
    }

    private TrainingContext buildMockContext() {
        return TrainingContext.builder()
                .athleteProfile("FTP: 280W, Weight: 72 kg")
                .timeContext("Today: 2026-05-17")
                .recentActivities(List.of("activity 1", "activity 2"))
                .pmcData(new HashMap<>())
                .weeklyVolume(new HashMap<>())
                .recentPredictionHistory(List.of())
                .build();
    }
}
