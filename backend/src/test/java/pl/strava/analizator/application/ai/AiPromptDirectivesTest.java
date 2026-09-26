package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.ai.AiLanguage;
import pl.strava.analizator.domain.ai.Persona;

@ExtendWith(MockitoExtension.class)
class AiPromptDirectivesTest {

    @Mock
    private AiSettingsService settings;

    @Test
    void systemSuffixCombinesCoachingPersonaAndLanguageDirective() {
        when(settings.currentCoachingStyle()).thenReturn(Persona.CONSERVATIVE_SCIENTIST);
        when(settings.currentLanguage()).thenReturn(AiLanguage.EN);
        PromptEngine engine = new PromptEngine();
        AiPromptDirectives directives = new AiPromptDirectives(settings, engine);

        String suffix = directives.systemSuffix();

        assertThat(suffix)
                .startsWith("COACHING PERSONA:")
                .contains(engine.personaPrompt(Persona.CONSERVATIVE_SCIENTIST))
                .endsWith(AiLanguage.EN.promptDirective());
    }
}
