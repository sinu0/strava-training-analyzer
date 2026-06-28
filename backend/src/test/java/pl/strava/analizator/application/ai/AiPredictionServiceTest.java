package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.application.dto.PredictionRequestDto;
import pl.strava.analizator.application.dto.PredictionResponseDto;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.TrainingContext;
import pl.strava.analizator.domain.ai.TrainingDataPort;
import pl.strava.analizator.domain.port.AiPredictionRepository;

@ExtendWith(MockitoExtension.class)
class AiPredictionServiceTest {

    @Mock private TrainingDataPort trainingDataPort;
    @Mock private LlmPort llmPort;
    @Mock private AiPredictionRepository predictionRepository;
    @Mock private CustomPromptService customPromptService;
    @Mock private ToolCallingLoop toolCallingLoop;

    private PromptRegistry promptRegistry;
    private LlmProviderRegistry providerRegistry;
    private ObjectMapper objectMapper;

    private AiPredictionService enabledService;
    private AiPredictionService disabledService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        promptRegistry = new PromptRegistry();

        when(llmPort.getProviderName()).thenReturn("ollama");
        providerRegistry = new LlmProviderRegistry(List.of(llmPort));
        lenient().when(customPromptService.getActiveForType(anyString())).thenReturn(Optional.empty());

        enabledService = new AiPredictionService(
                trainingDataPort, promptRegistry, providerRegistry,
                objectMapper, predictionRepository, customPromptService, null, toolCallingLoop,
                "ollama", "llama3", true, true, "0 0 3 * * *");

        disabledService = new AiPredictionService(
                trainingDataPort, promptRegistry, providerRegistry,
                objectMapper, predictionRepository, customPromptService, null, toolCallingLoop,
                "ollama", "llama3", false, true, "0 0 3 * * *");
    }

    @Test
    void predict_whenDisabled_throwsAiModuleDisabledException() {
        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        assertThatThrownBy(() -> disabledService.predict(request))
                .isInstanceOf(AiModuleDisabledException.class)
                .hasMessageContaining("ai.enabled=true");

        verify(trainingDataPort, never()).buildContext(any());
    }

    @Test
    void predict_invalidPredictionType_throwsIllegalArgument() {
        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("INVALID_TYPE")
                .build();

        assertThatThrownBy(() -> enabledService.predict(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void predict_validJsonResponse_parsesStructuredData() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);

        String llmResponse = """
                {
                  "currentFtpEstimate": 280,
                  "prediction4Weeks": 285,
                  "prediction12Weeks": 295,
                  "confidence": 0.78,
                  "keyFactors": ["Consistent training", "Good progression"],
                  "recommendations": ["Add more threshold work"],
                  "reasoning": "Based on recent training load..."
                }
                """;
        when(llmPort.chat(anyString(), anyString(), eq("llama3"))).thenReturn(llmResponse);

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getPredictionType()).isEqualTo("FTP_PREDICTION");
        assertThat(response.getModelId()).isEqualTo("llama3");
        assertThat(response.getProviderName()).isEqualTo("ollama");
        assertThat(response.getConfidence()).isEqualTo(0.78);
        assertThat(response.getSummary()).contains("280").contains("285");
        assertThat(response.getDetail()).isEqualTo("Based on recent training load...");
        assertThat(response.getStructuredData()).containsKey("currentFtpEstimate");
        assertThat(response.getId()).isNotNull();
        assertThat(response.getCreatedAt()).isNotNull();
    }

    @Test
    void predict_jsonInMarkdownFences_parsesCorrectly() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FATIGUE_PREDICTION)).thenReturn(context);

        String llmResponse = """
                ```json
                {
                  "fatigueLevel": 65,
                  "daysToRecovery": 2,
                  "overreachingRisk": "moderate",
                  "confidence": 0.85,
                  "reasoning": "Elevated fatigue"
                }
                ```
                """;
        when(llmPort.chat(anyString(), anyString(), eq("llama3"))).thenReturn(llmResponse);

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FATIGUE_PREDICTION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getConfidence()).isEqualTo(0.85);
        assertThat(response.getSummary()).contains("65").contains("2");
    }

    @Test
    void predict_invalidJsonResponse_fallsBackToRawText() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);

        String llmResponse = "I cannot parse your request properly, but I think your FTP is around 280W.";
        when(llmPort.chat(anyString(), anyString(), eq("llama3"))).thenReturn(llmResponse);

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getConfidence()).isEqualTo(0.5);
        assertThat(response.getSummary()).isNotBlank();
        assertThat(response.getDetail()).isEqualTo(llmResponse);
    }

    @Test
    void predict_customModelId_overridesDefault() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);
        when(llmPort.chat(anyString(), anyString(), eq("mistral"))).thenReturn("{\"confidence\": 0.6}");

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .modelId("mistral")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getModelId()).isEqualTo("mistral");
        verify(llmPort).chat(anyString(), anyString(), eq("mistral"));
    }

    @Test
    void predict_extraParameters_mergedIntoPromptVariables() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);
        when(llmPort.chat(anyString(), anyString(), anyString())).thenReturn("{\"confidence\": 0.7}");

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .extraParameters(Map.of("customParam", "customValue"))
                .build();

        enabledService.predict(request);

        verify(llmPort).chat(anyString(), anyString(), anyString());
    }

    @Test
    void predict_passesCorrectSystemPromptToLlm() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);
        when(llmPort.chat(anyString(), anyString(), anyString())).thenReturn("{\"confidence\": 0.7}");

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        enabledService.predict(request);

        ArgumentCaptor<String> systemCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> userCaptor = ArgumentCaptor.forClass(String.class);
        verify(llmPort).chat(systemCaptor.capture(), userCaptor.capture(), anyString());

        assertThat(systemCaptor.getValue()).contains("cycling");
        assertThat(userCaptor.getValue()).contains("FTP: 250 W");
        assertThat(userCaptor.getValue()).contains("Respond ONLY with valid JSON");
    }

    @Test
    void getStatus_enabled_returnsFullStatus() {
        when(llmPort.isAvailable("llama3")).thenReturn(true);
        when(predictionRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of());

        var status = enabledService.getStatus();

        assertThat(status.isEnabled()).isTrue();
        assertThat(status.isBatchEnabled()).isTrue();
        assertThat(status.getBatchCron()).isEqualTo("0 0 3 * * *");
        assertThat(status.isTodayTipsReady()).isFalse();
        assertThat(status.getActiveProvider()).isEqualTo("ollama");
        assertThat(status.getActiveModel()).isEqualTo("llama3");
        assertThat(status.isModelAvailable()).isTrue();
        assertThat(status.getAvailableProviders()).contains("ollama");
        assertThat(status.getAvailablePredictionTypes()).contains("FTP_PREDICTION", "FATIGUE_PREDICTION");
    }

    @Test
    void getStatus_disabled_modelNotChecked() {
        when(predictionRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of());
        var status = disabledService.getStatus();

        assertThat(status.isEnabled()).isFalse();
        assertThat(status.isModelAvailable()).isFalse();
        verify(llmPort, never()).isAvailable(anyString());
    }

    @Test
    void getStatus_modelCheckFails_modelAvailableFalse() {
        when(llmPort.isAvailable("llama3")).thenThrow(new RuntimeException("Connection refused"));
        when(predictionRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of());

        var status = enabledService.getStatus();

        assertThat(status.isEnabled()).isTrue();
        assertThat(status.isModelAvailable()).isFalse();
    }

    @Test
    void predict_trainingRecommendation_parsesTodayWorkout() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.TRAINING_TYPE_RECOMMENDATION)).thenReturn(context);

        String llmResponse = """
                {
                  "todayWorkout": {
                    "type": "endurance",
                    "durationMinutes": 90,
                    "targetZone": "Z2",
                    "targetTss": 65
                  },
                  "confidence": 0.82,
                  "reasoning": "Recovery week"
                }
                """;
        when(llmPort.chat(anyString(), anyString(), anyString())).thenReturn(llmResponse);

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("TRAINING_TYPE_RECOMMENDATION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getSummary()).contains("endurance").contains("90");
    }

    @Test
    void predict_trainingRecommendation_productiveFatigueAvoidsBlanketRest() {
        TrainingContext context = productiveFatigueContext();
        when(trainingDataPort.buildContext(PredictionType.TRAINING_TYPE_RECOMMENDATION)).thenReturn(context);

        String llmResponse = """
                {
                  "summary": "Take a full rest day today.",
                  "insight": "TSB is negative so full rest is safest.",
                  "action": "Full rest or 30 min easy recovery spin only.",
                  "todayWorkout": {
                    "type": "recovery",
                    "durationMinutes": 30,
                    "targetZone": "Z1",
                    "targetTss": 20
                  },
                  "confidence": 0.81,
                  "warnings": []
                }
                """;
        when(llmPort.chat(anyString(), anyString(), anyString())).thenReturn(llmResponse);

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("TRAINING_TYPE_RECOMMENDATION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getSummary()).containsIgnoringCase("kontrolowany bodziec");
        assertThat(response.getStructuredData())
                .containsEntry("summary", "Kontrolowany bodziec jest OK; nie potrzebujesz pełnego dnia wolnego.");
        assertThat(response.getStructuredData().get("action"))
                .asString()
                .contains("60-90 min Z2")
                .contains("tempo/sweet spot");
    }

    @Test
    void predict_toolCallingProvider_usesToolCallingLoop() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);
        when(llmPort.supportsToolCalling()).thenReturn(true);
        when(toolCallingLoop.run(anyString(), anyString(), isNull(), eq("ollama"), eq("llama3")))
                .thenReturn("{\"summary\":\"Use SQL-backed analysis\",\"confidence\":0.7}");

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getSummary()).contains("Use SQL-backed analysis");
        verify(toolCallingLoop).run(anyString(), anyString(), isNull(), eq("ollama"), eq("llama3"));
        verify(llmPort, never()).chat(anyString(), anyString(), eq("llama3"));
    }

    @Test
    void predict_longInvalidResponse_truncatesSummaryTo200Chars() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);

        String longText = "A".repeat(300);
        when(llmPort.chat(anyString(), anyString(), anyString())).thenReturn(longText);

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        PredictionResponseDto response = enabledService.predict(request);

        assertThat(response.getSummary()).hasSize(203);
    }

    @Test
    void predict_savesPredictionToRepository() {
        TrainingContext context = sampleContext();
        when(trainingDataPort.buildContext(PredictionType.FTP_PREDICTION)).thenReturn(context);
        when(llmPort.chat(anyString(), anyString(), eq("llama3"))).thenReturn("{\"confidence\": 0.7}");

        PredictionRequestDto request = PredictionRequestDto.builder()
                .predictionType("FTP_PREDICTION")
                .build();

        enabledService.predict(request);

        verify(predictionRepository).save(any(AiPrediction.class), eq("ollama"));
    }

    private TrainingContext sampleContext() {
        return TrainingContext.builder()
                .athleteProfile("FTP: 250 W, Weight: 75 kg, Max HR: 190 bpm, LTHR: 170 bpm")
                .recentActivities(List.of("[2024-06-01] Ride — Morning Ride, Duration: 60min"))
                .pmcData(Map.of("currentCTL", 55, "currentATL", 60, "currentTSB", -5))
                .ftpHistory(Map.of("2024-01-01", 240, "2024-06-01", 250))
                .weeklyVolume(Map.of())
                .zoneDistribution(Map.of())
                .readiness(Map.of("currentReadiness", 75))
                .powerCurve(Map.of())
                .build();
    }

    private TrainingContext productiveFatigueContext() {
        return TrainingContext.builder()
                .athleteProfile("FTP: 250 W, Weight: 75 kg, Max HR: 190 bpm, LTHR: 170 bpm")
                .recentActivities(List.of("[2024-06-03] Ride — Threshold Ride, Duration: 75min"))
                .pmcData(Map.of("currentCTL", 70, "currentATL", 84, "currentTSB", -18))
                .ftpHistory(Map.of("2024-01-01", 240, "2024-06-01", 250))
                .weeklyVolume(Map.of("currentWeekTss", 420, "previousWeekTss", 390))
                .zoneDistribution(Map.of())
                .readiness(Map.of(
                        "currentReadiness", 38,
                        "currentTSB", -18,
                        "currentCTL", 70,
                        "currentATL", 84,
                        "atlCtlRatio", 1.2,
                        "trainingWindow", "productive-fatigue",
                        "coachingGuidance",
                        "TSB between -30 and 0 is still a trainable window for aerobic, tempo, or controlled threshold work."
                ))
                .powerCurve(Map.of())
                .build();
    }
}
