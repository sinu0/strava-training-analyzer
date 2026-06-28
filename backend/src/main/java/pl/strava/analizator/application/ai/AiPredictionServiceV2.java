package pl.strava.analizator.application.ai;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.knowledge.KnowledgeBaseBuilder;
import pl.strava.analizator.application.ai.knowledge.RagServiceV2;
import pl.strava.analizator.application.ai.mcp.ToolCallingLoopV2;
import pl.strava.analizator.application.dto.CompareRequestDto;
import pl.strava.analizator.application.dto.PredictionRequestV2Dto;
import pl.strava.analizator.application.dto.PredictionResponseV2Dto;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.ai.ModelCapability;
import pl.strava.analizator.domain.ai.Persona;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.TrainingContext;
import pl.strava.analizator.domain.port.AiPredictionRepository;

@Service
@RequiredArgsConstructor
public class AiPredictionServiceV2 {

    private static final Logger log = LoggerFactory.getLogger(AiPredictionServiceV2.class);

    private final PromptEngine promptEngine;
    private final TrainingDataAdapter trainingDataAdapter;
    private final ModelCapabilityMatrix modelCapabilityMatrix;
    private final LlmProviderRegistry providerRegistry;
    private final ToolCallingLoopV2 toolCallingLoopV2;
    private final RagServiceV2 ragServiceV2;
    private final ResponseValidator responseValidator;
    private final KnowledgeBaseBuilder knowledgeBaseBuilder;
    private final AiPredictionRepository predictionRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.provider:ollama}")
    private String defaultProvider;

    @Value("${ai.model:qwen3.6:27b}")
    private String defaultModel;

    @Value("${ai.enabled:false}")
    private boolean enabled;

    public PredictionResponseV2Dto predict(PredictionRequestV2Dto request) {
        if (!enabled) throw new AiModuleDisabledException("AI module is disabled");

        long startMs = System.currentTimeMillis();

        PredictionType type = PredictionType.valueOf(request.getPredictionType());
        Persona persona = request.getPersona() != null
                ? Persona.valueOf(request.getPersona())
                : Persona.BALANCED_ADVISOR;
        String modelId = request.getModelId() != null ? request.getModelId() : defaultModel;

        TrainingContext ctx = trainingDataAdapter.buildContext(type);
        Map<String, String> variables = contextToVariables(ctx);

        String ragContext = "";
        if (ragServiceV2.isAvailable()) {
            ragContext = ragServiceV2.retrieveAndFormat(type,
                    ctx.getAthleteProfile() + " " + type.name(), 5);
            variables.put("knowledgeBase", ragContext);
        }

        DataQuality quality = assessDataQuality(ctx, type);
        PromptResult prompt = promptEngine.buildPrompt(type, variables, persona, quality);

        String providerName = resolveProvider(modelId);
        ToolCallingLoopV2.ToolLoopResult toolResult = toolCallingLoopV2.run(
                prompt.systemPrompt(), prompt.userPrompt(),
                null, providerName, modelId, type);

        String rawResponse = toolResult.finalResponse();
        long durationMs = System.currentTimeMillis() - startMs;

        ResponseValidator.ValidationResult validation = responseValidator.validate(rawResponse);
        if (!validation.ok()) {
            log.warn("Response validation failed: {}", validation.message());
            rawResponse = toolResult.hasError()
                    ? toolResult.finalResponse()
                    : "{\"summary\":\"Validation error\",\"insight\":\"Response format was invalid\",\"action\":\"Retry prediction\",\"metrics\":{},\"confidence\":0.0,\"reasoning\":\"" + validation.message() + "\"}";
        }

        Map<String, Object> structured = parseResponseToMap(rawResponse);
        String summary = structured.getOrDefault("summary", "N/A").toString();
        double confidence = extractDouble(structured, "confidence", 0.5);
        String detail = (String) structured.getOrDefault("insight",
                structured.getOrDefault("reasoning", rawResponse));

        AiPrediction prediction = AiPrediction.builder()
                .type(type)
                .modelId(modelId)
                .summary(summary)
                .detail(detail)
                .structuredData(structured)
                .confidence(confidence)
                .createdAt(Instant.now())
                .build();
        predictionRepository.save(prediction, providerName);

        return toV2Dto(prediction, toolResult.toolLog(), durationMs, providerName);
    }

    public List<PredictionResponseV2Dto> compare(CompareRequestDto request) {
        List<PredictionResponseV2Dto> results = new ArrayList<>();
        for (String model : request.getModels()) {
            PredictionRequestV2Dto req = PredictionRequestV2Dto.builder()
                    .predictionType(request.getPredictionType())
                    .modelId(model)
                    .persona("BALANCED_ADVISOR")
                    .build();
            try {
                results.add(predict(req));
            } catch (Exception e) {
                log.warn("Compare failed for model {}: {}", model, e.getMessage());
            }
        }
        return results;
    }

    public Map<String, Object> getAvailableModels() {
        Map<String, Object> result = new HashMap<>();
        result.put("primary", defaultModel);
        result.put("providers", providerRegistry.getAvailableProviders());
        result.put("available", true);
        return result;
    }

    public Map<String, Object> getKnowledgeStatus() {
        Map<String, Object> result = new HashMap<>();
        result.put("ragAvailable", ragServiceV2.isAvailable());
        result.put("refreshScheduled", "0 0 2 * * 0");
        return result;
    }

    public Map<String, Object> refreshKnowledge() {
        Map<String, Object> result = new HashMap<>();
        try {
            int count = knowledgeBaseBuilder.rebuild();
            result.put("status", "completed");
            result.put("documentsIndexed", count);
        } catch (Exception e) {
            result.put("status", "failed");
            result.put("error", e.getMessage());
        }
        return result;
    }

    public List<PredictionResponseV2Dto> getHistory(String type, int limit) {
        Instant from = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS);
        List<AiPrediction> predictions;
        if (type != null && !type.isBlank()) {
            predictions = predictionRepository.findByTypeAndCreatedAtBetween(type, from, Instant.now());
        } else {
            predictions = predictionRepository.findByCreatedAtBetween(from, Instant.now());
        }
        return predictions.stream()
                .limit(limit)
                .map(p -> toV2Dto(p, List.of(), 0))
                .toList();
    }

    private String resolveProvider(String modelId) {
        ModelCapability cap = modelCapabilityMatrix.resolve(modelId).orElse(null);
        if (cap != null && cap.supportsToolCalling()) {
            if (providerRegistry.hasProvider("ollama-v2")) {
                return "ollama-v2";
            }
        }
        if (providerRegistry.hasProvider(defaultProvider)) {
            return defaultProvider;
        }
        List<String> available = providerRegistry.getAvailableProviders();
        if (available.isEmpty()) {
            throw new AiModuleDisabledException("No LLM providers available. Check ai.* configuration.");
        }
        return available.get(0);
    }

    private DataQuality assessDataQuality(TrainingContext ctx, PredictionType type) {
        List<String> activities = ctx.getRecentActivities();
        int daysBack = trainingDataAdapter.getDaysBack(type);
        double density = activities != null ? (double) activities.size() / daysBack : 0;

        if (density < 0.15 || activities == null || activities.isEmpty()) return DataQuality.SPARSE;
        if (density < 0.40) return DataQuality.ADEQUATE;

        Map<String, Object> pmc = ctx.getPmcData();
        if (pmc == null) return DataQuality.SPARSE;
        Object ctl = pmc.get("currentCTL");
        Object atl = pmc.get("currentATL");
        Object tsb = pmc.get("currentTSB");
        boolean allZero = (ctl instanceof Number n1 && n1.doubleValue() == 0)
                && (atl instanceof Number n2 && n2.doubleValue() == 0)
                && (tsb instanceof Number n3 && n3.doubleValue() == 0);
        if (allZero) return DataQuality.SPARSE;

        return DataQuality.RICH;
    }

    private Map<String, String> contextToVariables(TrainingContext context) {
        Map<String, String> vars = new HashMap<>();
        vars.put("athleteProfile", context.getAthleteProfile() != null ? context.getAthleteProfile() : "N/A");
        vars.put("timeContext", context.getTimeContext() != null ? context.getTimeContext() : "N/A");
        vars.put("recentActivities", context.getRecentActivities() != null
                ? String.join("\n", context.getRecentActivities()) : "N/A");
        vars.put("pmcData", toJson(context.getPmcData()));
        vars.put("ftpHistory", toJson(context.getFtpHistory()));
        vars.put("weeklyVolume", toJson(context.getWeeklyVolume()));
        vars.put("zoneDistribution", toJson(context.getZoneDistribution()));
        vars.put("readiness", toJson(context.getReadiness()));
        vars.put("powerCurve", toJson(context.getPowerCurve()));
        vars.put("durability", toJson(context.getDurability()));
        vars.put("progressionLevels", toJson(context.getProgressionLevels()));
        vars.put("blockHealth", toJson(context.getBlockHealth()));
        vars.put("programReview", toJson(context.getProgramReview()));
        vars.put("coachSummary", toJson(context.getCoachSummary()));
        vars.put("coachMemory", toJson(context.getCoachMemory()));
        vars.put("recentPredictionHistory", context.getRecentPredictionHistory() != null && !context.getRecentPredictionHistory().isEmpty()
                ? String.join("\n", context.getRecentPredictionHistory()) : "No previous predictions for this type.");
        vars.put("raceProfile", toJson(context.getRaceProfile()));
        vars.put("plannedActivity", toJson(context.getPlannedActivity()));
        vars.put("eventDate", context.getEventDate() != null ? context.getEventDate() : "not set");
        vars.put("weatherConditions", toJson(context.getWeatherConditions()));
        vars.put("knowledgeBase", "");
        return vars;
    }

    private Map<String, Object> parseResponseToMap(String raw) {
        try {
            String json = raw.trim();
            if (!json.startsWith("{")) {
                int start = json.indexOf('{');
                int end = json.lastIndexOf('}');
                if (start >= 0 && end > start) json = json.substring(start, end + 1);
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse response as JSON: {}", e.getMessage());
            return Map.of("summary", raw.length() > 200 ? raw.substring(0, 200) + "..." : raw);
        }
    }

    private double extractDouble(Map<String, Object> map, String key, double defaultVal) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.doubleValue();
        return defaultVal;
    }

    private String toJson(Object obj) {
        if (obj == null) return "N/A";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "N/A";
        }
    }

    private PredictionResponseV2Dto toV2Dto(AiPrediction p, List<ToolCallingLoopV2.ToolCallLogEntry> toolLog, long durationMs) {
        return toV2Dto(p, toolLog, durationMs, "unknown");
    }

    private PredictionResponseV2Dto toV2Dto(AiPrediction p, List<ToolCallingLoopV2.ToolCallLogEntry> toolLog,
                                             long durationMs, String providerName) {
        Map<String, Object> data = p.getStructuredData() != null ? p.getStructuredData() : Map.of();

        PredictionResponseV2Dto.ConfidenceBreakdownDto cbd = null;
        if (data.containsKey("confidence_breakdown")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cb = (Map<String, Object>) data.get("confidence_breakdown");
            if (cb != null) {
                cbd = PredictionResponseV2Dto.ConfidenceBreakdownDto.builder()
                        .dataQuality(extractDouble(cb, "data_quality", 0.5))
                        .trendClarity(extractDouble(cb, "trend_clarity", 0.5))
                        .modelCertainty(extractDouble(cb, "model_certainty", 0.5))
                        .build();
            }
        }

        Map<String, String> metrics = safeMetricsMap(data.get("metrics"));

        @SuppressWarnings("unchecked")
        List<String> warnings = data.containsKey("warnings")
                ? safeStringList(data.get("warnings")) : List.of();

        @SuppressWarnings("unchecked")
        List<String> refs = data.containsKey("references")
                ? safeStringList(data.get("references")) : List.of();

        List<PredictionResponseV2Dto.AlternativeScenarioDto> alts = new ArrayList<>();
        if (data.containsKey("alternatives")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> altList = (List<Map<String, Object>>) data.get("alternatives");
            if (altList != null) {
                for (Map<String, Object> a : altList) {
                    alts.add(PredictionResponseV2Dto.AlternativeScenarioDto.builder()
                            .scenario((String) a.getOrDefault("scenario", ""))
                            .action((String) a.getOrDefault("action", ""))
                            .build());
                }
            }
        }

        List<PredictionResponseV2Dto.ToolCallLogDto> tcl = new ArrayList<>();
        if (toolLog != null) {
            for (var tle : toolLog) {
                tcl.add(PredictionResponseV2Dto.ToolCallLogDto.builder()
                        .toolName(tle.toolName())
                        .arguments(tle.arguments())
                        .resultSummary(tle.resultSummary())
                        .durationMs(tle.durationMs())
                        .error(tle.isError())
                        .build());
            }
        }

        return PredictionResponseV2Dto.builder()
                .id(p.getId() != null ? p.getId().toString() : null)
                .type(p.getType().name())
                .modelId(p.getModelId())
                .providerName(providerName)
                .summary(safeString(data, "summary", p.getSummary()))
                .insight(safeString(data, "insight", p.getDetail()))
                .action(safeString(data, "action", ""))
                .metrics(metrics)
                .confidence(p.getConfidence())
                .confidenceBreakdown(cbd)
                .reasoning(safeString(data, "reasoning", ""))
                .warnings(warnings)
                .alternatives(alts)
                .references(refs)
                .toolCallLog(tcl)
                .durationMs(durationMs)
                .createdAt(p.getCreatedAt() != null
                        ? java.time.OffsetDateTime.ofInstant(p.getCreatedAt(), java.time.ZoneOffset.UTC)
                        : null)
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> safeMetricsMap(Object metricsObj) {
        if (!(metricsObj instanceof Map)) return Map.of();
        Map<String, Object> raw = (Map<String, Object>) metricsObj;
        Map<String, String> result = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : raw.entrySet()) {
            Object v = e.getValue();
            if (v instanceof Number n) {
                result.put(e.getKey(), n.doubleValue() == Math.floor(n.doubleValue())
                        ? String.valueOf((long) n.doubleValue()) : String.valueOf(n.doubleValue()));
            } else {
                result.put(e.getKey(), String.valueOf(v));
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<String> safeStringList(Object obj) {
        if (obj instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private String safeString(Map<String, Object> data, String key, String fallback) {
        Object val = data.getOrDefault(key, fallback);
        return val != null ? val.toString() : fallback;
    }
}
