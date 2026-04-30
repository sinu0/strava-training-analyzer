package pl.strava.analizator.application.ai;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.application.dto.AiModuleStatusDto;
import pl.strava.analizator.application.dto.BatchRunResultDto;
import pl.strava.analizator.application.dto.CustomPromptDto;
import pl.strava.analizator.application.dto.PredictionRequestDto;
import pl.strava.analizator.application.dto.PredictionResponseDto;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.PromptTemplate;
import pl.strava.analizator.domain.ai.TrainingContext;
import pl.strava.analizator.domain.ai.TrainingDataPort;
import pl.strava.analizator.domain.port.AiPredictionRepository;

/**
 * Main AI prediction service that orchestrates:
 * 1. Building training context from historical data
 * 2. Selecting and populating prompt templates
 * 3. Sending to LLM provider
 * 4. Parsing and returning structured predictions
 */
@Service
public class AiPredictionService {

    private static final Logger log = LoggerFactory.getLogger(AiPredictionService.class);

    private final TrainingDataPort trainingDataPort;
    private final PromptRegistry promptRegistry;
    private final LlmProviderRegistry providerRegistry;
    private final ObjectMapper objectMapper;
    private final AiPredictionRepository predictionRepository;
    private final CustomPromptService customPromptService;
    private final RagService ragService;
    private final ToolCallingLoop toolCallingLoop;
    private final String defaultProvider;
    private final String defaultModel;
    private final boolean enabled;
    private final boolean batchEnabled;
    private final String batchCron;

    public AiPredictionService(TrainingDataPort trainingDataPort,
                                PromptRegistry promptRegistry,
                                LlmProviderRegistry providerRegistry,
                                 ObjectMapper objectMapper,
                                 AiPredictionRepository predictionRepository,
                                  CustomPromptService customPromptService,
                                  @org.springframework.lang.Nullable RagService ragService,
                                  ToolCallingLoop toolCallingLoop,
                                  @Value("${ai.provider:ollama}") String defaultProvider,
                                  @Value("${ai.model:llama3}") String defaultModel,
                                  @Value("${ai.enabled:false}") boolean enabled,
                                 @Value("${ai.batch.enabled:true}") boolean batchEnabled,
                                 @Value("${ai.batch.cron:0 0 3 * * *}") String batchCron) {
        this.trainingDataPort = trainingDataPort;
        this.promptRegistry = promptRegistry;
        this.providerRegistry = providerRegistry;
        this.objectMapper = objectMapper;
        this.predictionRepository = predictionRepository;
        this.customPromptService = customPromptService;
        this.ragService = ragService;
        this.toolCallingLoop = toolCallingLoop;
        this.defaultProvider = defaultProvider;
        this.defaultModel = defaultModel;
        this.enabled = enabled;
        this.batchEnabled = batchEnabled;
        this.batchCron = batchCron;
    }

    public PredictionResponseDto predict(PredictionRequestDto request) {
        if (!enabled) {
            throw new AiModuleDisabledException("AI module is not enabled. Set ai.enabled=true in configuration.");
        }

        PredictionType type = PredictionType.valueOf(request.getPredictionType());
        String modelId = request.getModelId() != null ? request.getModelId() : defaultModel;
        String providerName = defaultProvider;

        log.info("AI prediction requested: type={}, model={}, provider={}", type, modelId, providerName);

        // 1. Build training context from historical data
        TrainingContext context = trainingDataPort.buildContext(type);

        // 2. Get and populate prompt template (custom or default)
        PromptTemplate template = customPromptService.getActiveForType(type.name())
                .map(cp -> PromptTemplate.builder()
                        .type(type)
                        .systemPrompt(cp.getSystemPrompt())
                        .userPromptTemplate(cp.getUserPromptTemplate())
                        .responseFormat(cp.getResponseFormat() != null ? cp.getResponseFormat()
                                : promptRegistry.getTemplate(type).getResponseFormat())
                        .build())
                .orElse(promptRegistry.getTemplate(type));
        Map<String, String> variables = contextToVariables(context);
        // Inject responseFormat so template can use {{responseFormat}} placeholder
        variables.put("responseFormat", template.getResponseFormat());

        if (request.getExtraParameters() != null) {
            variables.putAll(request.getExtraParameters());
        }

        String systemPrompt = template.getSystemPrompt();
        String userPrompt = template.resolveUserPrompt(variables);

        String fullUserPrompt = userPrompt;

        // RAG: enrich with similar historical context if available
        if (ragService != null) {
            String ragContext = ragService.retrieveContext(type.name() + " " + userPrompt.substring(0, Math.min(200, userPrompt.length())));
            if (!ragContext.isEmpty()) {
                fullUserPrompt += "\n\nRelevant historical context:\n" + ragContext;
            }
        }

        fullUserPrompt += "\n\nRespond ONLY with valid JSON in this format:\n" + template.getResponseFormat();

        // 3. Send to LLM
        LlmPort provider = providerRegistry.getProvider(providerName);
        log.debug("Sending to LLM: provider={}, model={}, promptLength={}", providerName, modelId, fullUserPrompt.length());

        String rawResponse = provider.supportsToolCalling()
                ? toolCallingLoop.run(systemPrompt, fullUserPrompt, null, providerName, modelId)
                : provider.chat(systemPrompt, fullUserPrompt, modelId);

        // 4. Parse response
        AiPrediction prediction = parseResponse(rawResponse, type, modelId, context);

        log.info("AI prediction completed: type={}, confidence={}", type, prediction.getConfidence());

        // 5. Save prediction to DB
        try {
            predictionRepository.save(prediction, providerName);
        } catch (Exception e) {
            log.warn("Failed to save prediction to DB: {} | cause: {}", e.getMessage(),
                    e.getCause() != null ? e.getCause().getMessage() : "unknown", e);
        }

        return toDto(prediction, providerName);
    }

    public List<PredictionResponseDto> getHistory(String predictionType, int limit) {
        List<AiPrediction> predictions;
        if (predictionType != null && !predictionType.isBlank()) {
            predictions = predictionRepository.findByType(predictionType, limit);
        } else {
            predictions = predictionRepository.findRecent(limit);
        }
        return predictions.stream()
                .map(p -> toDto(p, defaultProvider))
                .toList();
    }

    public List<PredictionResponseDto> compareAcrossProviders(PredictionRequestDto request, List<String> providerNames) {
        if (!enabled) {
            throw new AiModuleDisabledException("AI module is not enabled.");
        }

        PredictionType type = PredictionType.valueOf(request.getPredictionType());
        String modelId = request.getModelId() != null ? request.getModelId() : defaultModel;

        TrainingContext context = trainingDataPort.buildContext(type);
        PromptTemplate template = customPromptService.getActiveForType(type.name())
                .map(cp -> PromptTemplate.builder()
                        .type(type)
                        .systemPrompt(cp.getSystemPrompt())
                        .userPromptTemplate(cp.getUserPromptTemplate())
                        .responseFormat(cp.getResponseFormat() != null ? cp.getResponseFormat()
                                : promptRegistry.getTemplate(type).getResponseFormat())
                        .build())
                .orElse(promptRegistry.getTemplate(type));

        Map<String, String> variables = contextToVariables(context);
        variables.put("responseFormat", template.getResponseFormat());
        if (request.getExtraParameters() != null) {
            variables.putAll(request.getExtraParameters());
        }
        String systemPrompt = template.getSystemPrompt();
        String userPrompt = template.resolveUserPrompt(variables);
        String fullUserPrompt = userPrompt + "\n\nRespond ONLY with valid JSON in this format:\n" + template.getResponseFormat();

        List<PredictionResponseDto> results = new java.util.ArrayList<>();
        for (String providerName : providerNames) {
            try {
                LlmPort provider = providerRegistry.getProvider(providerName);
                String rawResponse = provider.supportsToolCalling()
                        ? toolCallingLoop.run(systemPrompt, fullUserPrompt, null, providerName, modelId)
                        : provider.chat(systemPrompt, fullUserPrompt, modelId);
                AiPrediction prediction = parseResponse(rawResponse, type, modelId, context);
                try {
                    predictionRepository.save(prediction, providerName);
                } catch (Exception e) {
                    log.warn("Failed to save comparison prediction: {}", e.getMessage());
                }
                results.add(toDto(prediction, providerName));
            } catch (Exception e) {
                log.warn("Comparison failed for provider {}: {}", providerName, e.getMessage());
            }
        }
        return results;
    }

    public AiModuleStatusDto getStatus() {
        List<String> providers = providerRegistry.getAvailableProviders();
        boolean modelAvailable = false;
        boolean todayTipsReady = !predictionRepository.findByCreatedAtBetween(
                java.time.LocalDate.now().atStartOfDay(java.time.ZoneOffset.UTC).toInstant(),
                Instant.now()).isEmpty();

        if (enabled && providerRegistry.hasProvider(defaultProvider)) {
            try {
                modelAvailable = providerRegistry.getProvider(defaultProvider).isAvailable(defaultModel);
            } catch (Exception e) {
                log.warn("Failed to check model availability: {}", e.getMessage());
            }
        }

        return AiModuleStatusDto.builder()
                .enabled(enabled)
                .batchEnabled(batchEnabled)
                .batchCron(batchCron)
                .todayTipsReady(todayTipsReady)
                .activeProvider(defaultProvider)
                .activeModel(defaultModel)
                .modelAvailable(modelAvailable)
                .availableProviders(providers)
                .availablePredictionTypes(
                    promptRegistry.getAvailableTypes().stream()
                        .map(Enum::name)
                        .collect(Collectors.toList()))
                .build();
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
                ? String.join("\n", context.getRecentPredictionHistory())
                : "No previous predictions for this type.");
        return vars;
    }

    private String toJson(Object obj) {
        if (obj == null) return "N/A";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "N/A";
        }
    }

    private AiPrediction parseResponse(String rawResponse, PredictionType type, String modelId, TrainingContext context) {
        Map<String, Object> structured = Map.of();
        double confidence = 0.5;
        String summary;
        String detail = rawResponse;

        try {
            String jsonStr = extractJson(rawResponse);
            structured = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            structured = applyRecommendationGuardrails(type, context, structured);

            if (structured.containsKey("confidence")) {
                confidence = ((Number) structured.get("confidence")).doubleValue();
            }
            // Universal format: use "insight" as detail, fallback to "reasoning"
            if (structured.containsKey("insight")) {
                detail = (String) structured.get("insight");
            } else if (structured.containsKey("reasoning")) {
                detail = (String) structured.get("reasoning");
            }
            // Universal format: "summary" field is the primary summary
            summary = buildSummary(type, structured);
        } catch (Exception e) {
            log.warn("Failed to parse LLM response as JSON, using raw text: {}", e.getMessage());
            summary = rawResponse.length() > 200 ? rawResponse.substring(0, 200) + "..." : rawResponse;
        }

        return AiPrediction.builder()
                .id(UUID.randomUUID())
                .type(type)
                .modelId(modelId)
                .summary(summary)
                .detail(detail)
                .structuredData(structured)
                .confidence(confidence)
                .createdAt(Instant.now())
                .build();
    }

    private String extractJson(String text) {
        // Strip markdown code fences if present
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private Map<String, Object> applyRecommendationGuardrails(PredictionType type,
                                                              TrainingContext context,
                                                              Map<String, Object> structured) {
        if (type != PredictionType.TRAINING_TYPE_RECOMMENDATION || structured.isEmpty()) {
            return structured;
        }

        LoadSnapshot loadSnapshot = LoadSnapshot.from(context);
        if (!loadSnapshot.isProductiveFatigueWindow() || !isRestRecommendation(structured)) {
            return structured;
        }

        Map<String, Object> normalized = new HashMap<>(structured);
        normalized.put("summary", "Kontrolowany bodziec jest OK; nie potrzebujesz pełnego dnia wolnego.");
        normalized.put("insight",
                "TSB jest ujemny, ale nadal mieści się w produktywnym oknie zmęczenia."
                        + " Przy TSB %.0f i ATL/CTL %.2f warto zrobić kontrolowany bodziec zamiast pełnego rest day."
                        .formatted(loadSnapshot.tsb(), loadSnapshot.atlCtlRatio()));
        normalized.put("action", "60-90 min Z2 lub 2-3 x 8-12 min tempo/sweet spot; bez sprintów i VO2max.");

        Map<String, Object> metrics = copyMetrics(normalized.get("metrics"));
        metrics.put("TSB", formatMetric(loadSnapshot.tsb()));
        metrics.put("ATL/CTL", formatMetric(loadSnapshot.atlCtlRatio()));
        metrics.put("window", "produktywne zmęczenie");
        normalized.put("metrics", metrics);

        normalized.put("warnings", mergeWarnings(normalized.get("warnings"),
                "Jeśli noga jest pusta albo tętno nietypowo wysokie, skróć sesję i zejdź do Z2."));

        Map<String, Object> workout = copyNestedMap(normalized.get("todayWorkout"));
        workout.put("type", "tempo/endurance");
        workout.put("durationMinutes", 75);
        workout.put("targetZone", "Z2-Z3");
        workout.put("targetTss", 60);
        normalized.put("todayWorkout", workout);

        return normalized;
    }

    private boolean isRestRecommendation(Map<String, Object> structured) {
        StringBuilder signal = new StringBuilder();
        appendIfPresent(signal, structured.get("summary"));
        appendIfPresent(signal, structured.get("insight"));
        appendIfPresent(signal, structured.get("action"));
        if (structured.get("todayWorkout") instanceof Map<?, ?> workout) {
            appendIfPresent(signal, workout.get("type"));
        }
        String normalized = signal.toString().toLowerCase();
        return normalized.contains("full rest")
                || normalized.contains("rest day")
                || normalized.contains("rest or")
                || normalized.contains("easy recovery spin")
                || normalized.contains("recovery spin only")
                || normalized.contains("off day")
                || normalized.contains("odpoc")
                || normalized.contains("wolne")
                || normalized.contains("recovery");
    }

    private void appendIfPresent(StringBuilder signal, Object value) {
        if (value != null) {
            signal.append(value).append(' ');
        }
    }

    private Map<String, Object> copyMetrics(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> copy = new HashMap<>();
            map.forEach((key, entryValue) -> copy.put(String.valueOf(key), entryValue));
            return copy;
        }
        return new HashMap<>();
    }

    private Map<String, Object> copyNestedMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> copy = new HashMap<>();
            map.forEach((key, entryValue) -> copy.put(String.valueOf(key), entryValue));
            return copy;
        }
        return new HashMap<>();
    }

    private List<String> mergeWarnings(Object existingWarnings, String extraWarning) {
        List<String> warnings = new java.util.ArrayList<>();
        if (existingWarnings instanceof List<?> list) {
            list.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .forEach(warnings::add);
        }
        if (!warnings.contains(extraWarning)) {
            warnings.add(extraWarning);
        }
        return warnings;
    }

    private String formatMetric(double value) {
        return String.format(java.util.Locale.US, "%.2f", value);
    }

    private record LoadSnapshot(double readinessScore, double tsb, double ctl, double atl, double atlCtlRatio) {

        private static LoadSnapshot from(TrainingContext context) {
            Map<String, Object> readiness = context != null && context.getReadiness() != null
                    ? context.getReadiness()
                    : Map.of();
            Map<String, Object> pmc = context != null && context.getPmcData() != null
                    ? context.getPmcData()
                    : Map.of();

            double ctl = number(readiness, "currentCTL", pmc, "currentCTL");
            double atl = number(readiness, "currentATL", pmc, "currentATL");
            double tsb = number(readiness, "currentTSB", pmc, "currentTSB");
            double ratio = number(readiness, "atlCtlRatio", Map.of(), "unused");
            if (ratio == 0.0 && ctl > 0.0) {
                ratio = atl / ctl;
            }
            return new LoadSnapshot(
                    number(readiness, "currentReadiness", Map.of(), "unused"),
                    tsb,
                    ctl,
                    atl,
                    ratio);
        }

        private boolean isProductiveFatigueWindow() {
            return tsb >= -30.0
                    && tsb < 0.0
                    && readinessScore >= 25.0
                    && atlCtlRatio < 1.35;
        }

        private static double number(Map<String, Object> primary, String primaryKey,
                                     Map<String, Object> fallback, String fallbackKey) {
            Object value = primary.get(primaryKey);
            if (value == null && fallbackKey != null) {
                value = fallback.get(fallbackKey);
            }
            if (value instanceof Number number) {
                return number.doubleValue();
            }
            if (value instanceof String stringValue) {
                try {
                    return Double.parseDouble(stringValue);
                } catch (NumberFormatException ignored) {
                    return 0.0;
                }
            }
            return 0.0;
        }
    }

    private String buildSummary(PredictionType type, Map<String, Object> data) {
        // Universal format: all templates now produce a "summary" field directly
        if (data.containsKey("summary") && data.get("summary") instanceof String s && !s.isBlank()) {
            return s.length() > 300 ? s.substring(0, 297) + "..." : s;
        }
        // Legacy fallback for old-format responses
        return switch (type) {
            case FTP_PREDICTION -> String.format("FTP estimate: %s W, 4-week projection: %s W",
                    data.getOrDefault("currentFtpEstimate", "?"),
                    data.getOrDefault("prediction4Weeks", "?"));
            case FATIGUE_PREDICTION -> String.format("Fatigue level: %s/100, recovery: %s days",
                    data.getOrDefault("fatigueLevel", "?"),
                    data.getOrDefault("daysToRecovery", "?"));
            case TRAINING_TYPE_RECOMMENDATION -> {
                @SuppressWarnings("unchecked")
                var workout = data.get("todayWorkout") instanceof Map<?,?> m
                        ? (Map<String, Object>) m : Map.<String, Object>of();
                yield String.format("Recommended: %s, %s min",
                        workout.getOrDefault("type", "?"),
                        workout.getOrDefault("durationMinutes", "?"));
            }
            case PERFORMANCE_TREND -> String.format("Trend: %s, consistency: %s/100",
                    data.getOrDefault("overallTrend", "?"),
                    data.getOrDefault("consistencyScore", "?"));
            case OVERTRAINING_RISK -> String.format("Risk: %s (%s/100)",
                    data.getOrDefault("riskLevel", "?"),
                    data.getOrDefault("riskScore", "?"));
            case RACE_READINESS -> String.format("Readiness: %s (%s/100)",
                    data.getOrDefault("readinessLevel", "?"),
                    data.getOrDefault("readinessScore", "?"));
            case TRAINING_COACH_SUMMARY -> String.format("Coach focus: %s",
                    data.getOrDefault("nextFocus", data.getOrDefault("summary", "?")));
        };
    }

    private static final List<String> ALL_PREDICTION_TYPES = List.of(
            "TRAINING_TYPE_RECOMMENDATION", "FATIGUE_PREDICTION", "OVERTRAINING_RISK",
            "PERFORMANCE_TREND", "FTP_PREDICTION", "RACE_READINESS", "TRAINING_COACH_SUMMARY");

    public BatchRunResultDto runBatch(boolean skipExisting) {
        log.info("Starting batch AI predictions (skipExisting={})", skipExisting);

        if (!enabled) {
            String msg = "Moduł AI jest wyłączony. Ustaw ai.enabled=true w konfiguracji.";
            log.error("Batch aborted: {}", msg);
            return BatchRunResultDto.builder()
                    .success(0).skipped(0).failed(ALL_PREDICTION_TYPES.size())
                    .message(msg).build();
        }

        if (!providerRegistry.hasProvider(defaultProvider)) {
            String msg = "Dostawca AI '%s' nie jest dostępny. Dostępni: %s"
                    .formatted(defaultProvider, providerRegistry.getAvailableProviders());
            log.error("Batch aborted: {}", msg);
            return BatchRunResultDto.builder()
                    .success(0).skipped(0).failed(ALL_PREDICTION_TYPES.size())
                    .message(msg).build();
        }

        int success = 0, skipped = 0, failed = 0;
        for (String type : ALL_PREDICTION_TYPES) {
            try {
                if (skipExisting && predictionRepository.existsTodayForType(type)) {
                    log.info("Skipping type={} — already generated today", type);
                    skipped++;
                    continue;
                }
                predict(PredictionRequestDto.builder().predictionType(type).build());
                log.info("Batch prediction completed: type={}", type);
                success++;
            } catch (Exception e) {
                log.error("Batch prediction failed for type={}: {}", type, e.getMessage(), e);
                failed++;
            }
        }
        String message = "Ukończono: %d sukces, %d pominięte, %d błędy".formatted(success, skipped, failed);
        log.info("Batch predictions finished: {} success, {} skipped, {} failed", success, skipped, failed);
        return BatchRunResultDto.builder().success(success).skipped(skipped).failed(failed).message(message).build();
    }

    public List<PredictionResponseDto> getTodayTips() {
        Instant startOfDay = java.time.LocalDate.now()
                .atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        Instant now = Instant.now();
        List<AiPrediction> todayPredictions = predictionRepository.findByCreatedAtBetween(startOfDay, now);
        // Return latest prediction per type
        return todayPredictions.stream()
                .collect(Collectors.toMap(
                        p -> p.getType().name(),
                        p -> p,
                        (a, b) -> a.getCreatedAt().isAfter(b.getCreatedAt()) ? a : b))
                .values().stream()
                .map(p -> toDto(p, defaultProvider))
                .sorted(Comparator.comparing(PredictionResponseDto::getPredictionType))
                .toList();
    }

    public PredictionResponseDto verifyPrediction(UUID predictionId, Map<String, Object> actualData) {
        AiPrediction prediction = predictionRepository.findById(predictionId);
        if (prediction == null) {
            throw new IllegalArgumentException("Prediction not found: " + predictionId);
        }
        double accuracy = computeAccuracy(prediction.getStructuredData(), actualData, prediction.getType());
        AiPrediction updated = predictionRepository.updateAccuracy(predictionId, actualData, accuracy);
        return toDto(updated, defaultProvider);
    }

    private double computeAccuracy(Map<String, Object> predicted, Map<String, Object> actual, PredictionType type) {
        try {
            return switch (type) {
                case FTP_PREDICTION -> compareNumeric(predicted, actual, "currentFtpEstimate");
                case FATIGUE_PREDICTION -> compareNumeric(predicted, actual, "fatigueLevel");
                case OVERTRAINING_RISK -> compareNumeric(predicted, actual, "riskScore");
                case RACE_READINESS -> compareNumeric(predicted, actual, "readinessScore");
                default -> compareGeneric(predicted, actual);
            };
        } catch (Exception e) {
            log.warn("Failed to compute accuracy: {}", e.getMessage());
            return 0.5;
        }
    }

    private double compareNumeric(Map<String, Object> predicted, Map<String, Object> actual, String key) {
        if (!predicted.containsKey(key) || !actual.containsKey(key)) {
            return compareGeneric(predicted, actual);
        }
        double predictedVal = ((Number) predicted.get(key)).doubleValue();
        double actualVal = ((Number) actual.get(key)).doubleValue();
        if (actualVal == 0) return predictedVal == 0 ? 1.0 : 0.5;
        double error = Math.abs(predictedVal - actualVal) / actualVal;
        return Math.max(0, 1.0 - error);
    }

    private double compareGeneric(Map<String, Object> predicted, Map<String, Object> actual) {
        if (predicted.isEmpty() || actual.isEmpty()) return 0.5;
        long matching = actual.keySet().stream()
                .filter(predicted::containsKey)
                .filter(k -> String.valueOf(predicted.get(k)).equals(String.valueOf(actual.get(k))))
                .count();
        return (double) matching / actual.size();
    }

    private PredictionResponseDto toDto(AiPrediction prediction, String providerName) {
        return PredictionResponseDto.builder()
                .id(prediction.getId())
                .predictionType(prediction.getType().name())
                .modelId(prediction.getModelId())
                .providerName(providerName)
                .summary(prediction.getSummary())
                .detail(prediction.getDetail())
                .structuredData(prediction.getStructuredData())
                .confidence(prediction.getConfidence())
                .createdAt(prediction.getCreatedAt())
                .actualData(prediction.getActualData())
                .accuracyScore(prediction.getAccuracyScore())
                .verifiedAt(prediction.getVerifiedAt())
                .build();
    }
}
