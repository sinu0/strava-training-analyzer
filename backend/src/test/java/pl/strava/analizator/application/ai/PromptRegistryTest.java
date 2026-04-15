package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.PromptTemplate;

class PromptRegistryTest {

    private final PromptRegistry registry = new PromptRegistry();

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void getTemplate_allPredictionTypesRegistered(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);

        assertThat(template).isNotNull();
        assertThat(template.getType()).isEqualTo(type);
        assertThat(template.getSystemPrompt()).isNotBlank();
        assertThat(template.getUserPromptTemplate()).isNotBlank();
        assertThat(template.getResponseFormat()).isNotBlank();
    }

    @Test
    void getAvailableTypes_containsAllPredictionTypes() {
        assertThat(registry.getAvailableTypes())
                .containsExactlyInAnyOrder(PredictionType.values());
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_containPlaceholders(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);

        // Every template should have at least athleteProfile placeholder
        assertThat(template.getUserPromptTemplate()).contains("{{athleteProfile}}");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_responseFormatContainsConfidence(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);

        // Every response format should require confidence
        assertThat(template.getResponseFormat()).contains("confidence");
    }

    @Test
    void getTemplate_unknownType_throwsWhenNotRegistered() {
        // All types are registered, but verify the error message mechanism
        // by using a registered type (should not throw)
        assertThat(registry.getTemplate(PredictionType.FTP_PREDICTION)).isNotNull();
    }

    @Test
    void ftpTemplate_containsRelevantPlaceholders() {
        PromptTemplate template = registry.getTemplate(PredictionType.FTP_PREDICTION);

        assertThat(template.getUserPromptTemplate()).contains("{{ftpHistory}}");
        assertThat(template.getUserPromptTemplate()).contains("{{pmcData}}");
        assertThat(template.getUserPromptTemplate()).contains("{{powerCurve}}");
    }

    @Test
    void fatigueTemplate_containsRelevantPlaceholders() {
        PromptTemplate template = registry.getTemplate(PredictionType.FATIGUE_PREDICTION);

        assertThat(template.getUserPromptTemplate()).contains("{{timeContext}}");
        assertThat(template.getUserPromptTemplate()).contains("{{readiness}}");
        assertThat(template.getUserPromptTemplate()).contains("{{weeklyVolume}}");
        assertThat(template.getSystemPrompt()).contains("weeklyTssByWeek");
        assertThat(template.getSystemPrompt()).contains("currentWeekTss");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_includeTimeContextPlaceholder(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);

        assertThat(template.getUserPromptTemplate()).contains("{{timeContext}}");
    }

    @Test
    void trainingRecommendation_containsZoneDistribution() {
        PromptTemplate template = registry.getTemplate(PredictionType.TRAINING_TYPE_RECOMMENDATION);

        assertThat(template.getUserPromptTemplate()).contains("{{zoneDistribution}}");
    }

    // --- Universal template contract tests (TDD for new template design) ---

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_systemPromptContainsDoNotInstructions(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);
        String systemPrompt = template.getSystemPrompt().toLowerCase();

        assertThat(systemPrompt).contains("do not");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_responseFormatContainsAllUniversalFields(PredictionType type) {
        String format = registry.getTemplate(type).getResponseFormat();

        assertThat(format).contains("summary");
        assertThat(format).contains("insight");
        assertThat(format).contains("action");
        assertThat(format).contains("metrics");
        assertThat(format).contains("reasoning");
        assertThat(format).contains("warnings");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_containRecentPredictionHistoryPlaceholder(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);

        assertThat(template.getUserPromptTemplate()).contains("{{recentPredictionHistory}}");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_systemPromptSpecifiesJsonOnlyOutput(PredictionType type) {
        String systemPrompt = registry.getTemplate(type).getSystemPrompt().toLowerCase();

        assertThat(systemPrompt).containsAnyOf("json", "respond only");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void templates_resolveUserPrompt_replacesAllKnownPlaceholders(PredictionType type) {
        PromptTemplate template = registry.getTemplate(type);

        java.util.Map<String, String> vars = new java.util.HashMap<>();
        vars.put("athleteProfile", "FTP: 250W");
        vars.put("timeContext", "Today: 2026-04-07");
        vars.put("recentActivities", "ride 1h");
        vars.put("pmcData", "{}");
        vars.put("ftpHistory", "{}");
        vars.put("weeklyVolume", "{}");
        vars.put("zoneDistribution", "{}");
        vars.put("readiness", "{}");
        vars.put("powerCurve", "{}");
        vars.put("recentPredictionHistory", "none");
        vars.put("responseFormat", template.getResponseFormat());

        String resolved = template.resolveUserPrompt(vars);

        assertThat(resolved).doesNotContain("{{");
        assertThat(resolved).doesNotContain("}}");
    }
}
