package pl.strava.analizator.domain.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

class PromptTemplateTest {

    @Test
    void resolveUserPrompt_replacesAllPlaceholders() {
        PromptTemplate template = PromptTemplate.builder()
                .type(PredictionType.FTP_PREDICTION)
                .systemPrompt("system")
                .userPromptTemplate("Profile: {{athleteProfile}}, Activities: {{recentActivities}}")
                .responseFormat("{}")
                .build();

        String resolved = template.resolveUserPrompt(Map.of(
                "athleteProfile", "FTP: 250 W",
                "recentActivities", "Ride1, Ride2"
        ));

        assertThat(resolved).isEqualTo("Profile: FTP: 250 W, Activities: Ride1, Ride2");
    }

    @Test
    void resolveUserPrompt_unknownPlaceholderLeftAsIs() {
        PromptTemplate template = PromptTemplate.builder()
                .type(PredictionType.FATIGUE_PREDICTION)
                .systemPrompt("system")
                .userPromptTemplate("Data: {{unknown}}")
                .responseFormat("{}")
                .build();

        String resolved = template.resolveUserPrompt(Map.of("other", "value"));

        assertThat(resolved).isEqualTo("Data: {{unknown}}");
    }

    @Test
    void resolveUserPrompt_emptyVariablesMap_noChange() {
        PromptTemplate template = PromptTemplate.builder()
                .type(PredictionType.PERFORMANCE_TREND)
                .systemPrompt("system")
                .userPromptTemplate("Static text without placeholders")
                .responseFormat("{}")
                .build();

        String resolved = template.resolveUserPrompt(Map.of());

        assertThat(resolved).isEqualTo("Static text without placeholders");
    }

    @Test
    void resolveUserPrompt_multipleSamePlaceholder_replacesAll() {
        PromptTemplate template = PromptTemplate.builder()
                .type(PredictionType.RACE_READINESS)
                .systemPrompt("system")
                .userPromptTemplate("{{name}} is {{name}}")
                .responseFormat("{}")
                .build();

        String resolved = template.resolveUserPrompt(Map.of("name", "cyclist"));

        assertThat(resolved).isEqualTo("cyclist is cyclist");
    }
}
