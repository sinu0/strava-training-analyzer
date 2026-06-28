package pl.strava.analizator.application.ai;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.Persona;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.PromptSet;

@Component
public class PromptEngine {

    private static final Logger log = LoggerFactory.getLogger(PromptEngine.class);

    private final Map<PredictionType, PromptSet> cache = new EnumMap<>(PredictionType.class);
    private String universalRules;
    private String responseFormat;

    private final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

    public PromptEngine() {
        loadAll();
    }

    private void loadAll() {
        universalRules = loadResource("classpath:/ai/prompts/_universal_rules.md");
        responseFormat = loadResource("classpath:/ai/prompts/_response_format_v2.json");

        for (PredictionType type : PredictionType.values()) {
            String dir = typeToDir(type);
            String system = loadResource("classpath:/ai/prompts/" + dir + "/system.md");
            String userTemplate = loadResource("classpath:/ai/prompts/" + dir + "/user_template.md");
            String fewShot = loadResource("classpath:/ai/prompts/" + dir + "/few_shot.md");

            if (system != null && userTemplate != null) {
                cache.put(type, new PromptSet(system, userTemplate,
                        fewShot != null ? fewShot : "", responseFormat));
            }
        }

        log.info("PromptEngine loaded {} prediction type prompts", cache.size());
    }

    public PromptResult buildPrompt(PredictionType type, Map<String, String> variables,
                                     Persona persona, DataQuality quality) {
        PromptSet set = cache.get(type);
        if (set == null) {
            throw new IllegalArgumentException("No prompt set registered for: " + type);
        }

        String personaPrompt = loadPersona(persona);
        String systemPrompt = assembleSystem(set.systemPrompt(), personaPrompt, quality, type);
        String userPrompt = assembleUser(set, variables, quality);

        return new PromptResult(systemPrompt, userPrompt, type);
    }

    public PromptResult buildPrompt(PredictionType type, Map<String, String> variables) {
        return buildPrompt(type, variables, Persona.BALANCED_ADVISOR, DataQuality.ADEQUATE);
    }

    private String assembleSystem(String base, String persona, DataQuality quality, PredictionType type) {
        StringBuilder sb = new StringBuilder();
        sb.append(base).append("\n\n");

        if (persona != null && !persona.isBlank()) {
            sb.append("COACHING PERSONA:\n").append(persona).append("\n\n");
        }

        if (quality == DataQuality.SPARSE) {
            sb.append("""
                    DATA QUALITY: Training data is sparse for this analysis window.
                    - Lower your confidence to < 0.5
                    - Limit analysis to 3 key metrics
                    - State clearly what data would improve the prediction
                    - Do not fabricate numbers — use only what is provided

                    """);
        } else if (quality == DataQuality.ADEQUATE) {
            sb.append("""
                    DATA QUALITY: Adequate data available. Standard analysis depth expected.
                    - Confidence should reflect data gaps if any
                    - Use available tools to supplement missing data

                    """);
        }

        sb.append("RESPONSE FORMAT:\n").append(responseFormat).append("\n\n");
        sb.append(universalRules);

        return sb.toString();
    }

    private String assembleUser(PromptSet set, Map<String, String> variables, DataQuality quality) {
        StringBuilder sb = new StringBuilder();

        String fewShot = set.fewShot();
        if (fewShot != null && !fewShot.isBlank() && quality != DataQuality.SPARSE) {
            sb.append("REFERENCE EXAMPLES (study these before responding):\n\n");
            sb.append(fewShot).append("\n\n");
            sb.append("--- END OF EXAMPLES ---\n\n");
        }

        sb.append("TRAINING DATA FOR ANALYSIS:\n\n");

        String template = set.userTemplate();
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            template = template.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        sb.append(template);

        sb.append("\n\nRespond with a single JSON object following the response format exactly. "
                + "No text before or after the JSON.");

        return sb.toString();
    }

    private String loadPersona(Persona persona) {
        if (persona == null) persona = Persona.BALANCED_ADVISOR;
        String filename = switch (persona) {
            case AGGRESSIVE_COACH -> "personas/aggressive_coach.md";
            case CONSERVATIVE_SCIENTIST -> "personas/conservative_scientist.md";
            case BALANCED_ADVISOR -> "personas/balanced_advisor.md";
        };
        return loadResource("classpath:/ai/prompts/" + filename);
    }

    private String typeToDir(PredictionType type) {
        return switch (type) {
            case FTP_PREDICTION -> "ftp_prediction";
            case FATIGUE_PREDICTION -> "fatigue_prediction";
            case TRAINING_TYPE_RECOMMENDATION -> "training_type_recommendation";
            case PERFORMANCE_TREND -> "performance_trend";
            case OVERTRAINING_RISK -> "overtraining_risk";
            case RACE_READINESS -> "race_readiness";
            case TRAINING_COACH_SUMMARY -> "training_coach_summary";
            case RACE_PACING_STRATEGY -> "race_pacing_strategy";
            case NUTRITION_PLAN -> "nutrition_plan";
            case RECOVERY_PLAN -> "recovery_plan";
            case INJURY_RISK -> "injury_risk";
            case PEAK_TIMING -> "peak_timing";
        };
    }

    private String loadResource(String path) {
        try {
            Resource resource = resolver.getResource(path);
            if (!resource.exists()) {
                log.warn("Prompt resource not found: {}", path);
                return null;
            }
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.warn("Failed to load prompt resource {}: {}", path, e.getMessage());
            return null;
        }
    }

    public boolean hasPromptsFor(PredictionType type) {
        return cache.containsKey(type);
    }
}
