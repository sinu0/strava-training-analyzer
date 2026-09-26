package pl.strava.analizator.application.ai;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.ai.AiLanguage;

/**
 * User-chosen coaching persona + output language, appended to system prompts that are not built by
 * {@link PromptEngine} (V1 predictions, activity notes, follow-up answers).
 */
@Component
@RequiredArgsConstructor
public class AiPromptDirectives {

    private final AiSettingsService settings;
    private final PromptEngine promptEngine;

    public String systemSuffix() {
        String persona = promptEngine.personaPrompt(settings.currentCoachingStyle());
        String personaBlock = persona == null || persona.isBlank() ? "" : "COACHING PERSONA:\n" + persona.strip() + "\n\n";
        return personaBlock + settings.currentLanguage().promptDirective();
    }

    public AiLanguage language() {
        return settings.currentLanguage();
    }
}
