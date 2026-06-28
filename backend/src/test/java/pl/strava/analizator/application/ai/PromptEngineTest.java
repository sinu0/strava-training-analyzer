package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import pl.strava.analizator.domain.ai.Persona;
import pl.strava.analizator.domain.ai.PredictionType;

class PromptEngineTest {

    private final PromptEngine engine = new PromptEngine();

    @Test
    void buildPrompt_validType_returnsNonEmptyPrompt() {
        PromptResult result = engine.buildPrompt(PredictionType.FTP_PREDICTION, Map.of());

        assertThat(result.systemPrompt()).isNotBlank();
        assertThat(result.userPrompt()).isNotBlank();
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void buildPrompt_allTwelveTypes_succeed(PredictionType type) {
        PromptResult result = engine.buildPrompt(type, Map.of());

        assertThat(result.systemPrompt()).isNotBlank();
        assertThat(result.userPrompt()).isNotBlank();
    }

    @Test
    void buildPrompt_withPersona_includesPersonaInSystem() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.AGGRESSIVE_COACH,
                DataQuality.ADEQUATE);

        assertThat(result.systemPrompt()).contains("COACHING PERSONA:");
    }

    @Test
    void buildPrompt_withSparseQuality_lowersConfidenceGuidance() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.BALANCED_ADVISOR,
                DataQuality.SPARSE);

        assertThat(result.systemPrompt()).contains("Lower your confidence to < 0.5");
    }

    @Test
    void buildPrompt_withRichQuality_noSparseWarnings() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.BALANCED_ADVISOR,
                DataQuality.RICH);

        assertThat(result.systemPrompt()).doesNotContain("Lower your confidence");
    }

    @Test
    void buildPrompt_resolvesPlaceholders() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of("athleteProfile", "FTP: 300W"));

        assertThat(result.userPrompt()).contains("FTP: 300W");
    }

    @Test
    void buildPrompt_includesFewShot_whenQualityAdequate() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.BALANCED_ADVISOR,
                DataQuality.ADEQUATE);

        assertThat(result.userPrompt()).contains("REFERENCE EXAMPLES");
    }

    @Test
    void buildPrompt_includesFewShot_whenQualityRich() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.BALANCED_ADVISOR,
                DataQuality.RICH);

        assertThat(result.userPrompt()).contains("REFERENCE EXAMPLES");
    }

    @Test
    void buildPrompt_excludesFewShot_whenSparse() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.BALANCED_ADVISOR,
                DataQuality.SPARSE);

        assertThat(result.userPrompt()).doesNotContain("REFERENCE EXAMPLES");
    }

    @ParameterizedTest
    @EnumSource(PredictionType.class)
    void hasPromptsFor_existingType_returnsTrue(PredictionType type) {
        assertThat(engine.hasPromptsFor(type)).isTrue();
    }

    @Test
    void loadPersona_aggressiveCoach_loadsNonBlankString() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.AGGRESSIVE_COACH,
                DataQuality.ADEQUATE);

        assertThat(result.systemPrompt()).contains("aggressive");
    }

    @Test
    void loadPersona_conservativeScientist_loadsNonBlankString() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.CONSERVATIVE_SCIENTIST,
                DataQuality.ADEQUATE);

        assertThat(result.systemPrompt()).contains("science-first");
    }

    @Test
    void loadPersona_balancedAdvisor_loadsNonBlankString() {
        PromptResult result = engine.buildPrompt(
                PredictionType.FTP_PREDICTION,
                Map.of(),
                Persona.BALANCED_ADVISOR,
                DataQuality.ADEQUATE);

        assertThat(result.systemPrompt()).contains("data-driven");
    }
}
