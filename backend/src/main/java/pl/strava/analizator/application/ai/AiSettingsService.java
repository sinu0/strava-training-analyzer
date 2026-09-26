package pl.strava.analizator.application.ai;

import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AiSettingsDto;
import pl.strava.analizator.domain.ai.AiLanguage;
import pl.strava.analizator.domain.ai.AiSettings;
import pl.strava.analizator.domain.ai.Persona;
import pl.strava.analizator.domain.port.AiSettingsRepository;

/** AI preferences — works regardless of `ai.enabled`, so the language can be chosen before AI is switched on. */
@Service
@RequiredArgsConstructor
public class AiSettingsService {

    private static final Logger log = LoggerFactory.getLogger(AiSettingsService.class);
    private static final List<String> AVAILABLE_LANGUAGES = Arrays.stream(AiLanguage.values())
            .map(AiLanguage::code)
            .toList();
    private static final List<String> AVAILABLE_COACHING_STYLES = List.of(
            Persona.BALANCED_ADVISOR.name(), Persona.CONSERVATIVE_SCIENTIST.name(), Persona.AGGRESSIVE_COACH.name());

    private final AiSettingsRepository repository;

    @Transactional(readOnly = true)
    public AiSettingsDto getSettings() {
        return toDto(repository.find().orElseGet(AiSettings::defaults));
    }

    @Transactional
    public AiSettingsDto updateSettings(AiSettingsDto request) {
        if (request == null) {
            throw new IllegalArgumentException("AI settings are required");
        }
        AiSettings.AiSettingsBuilder next = repository.find().orElseGet(AiSettings::defaults).toBuilder();
        // Partial update: a missing field keeps its current value.
        if (request.getLanguage() != null) {
            next.language(AiLanguage.fromCode(request.getLanguage()));
        }
        if (request.getCoachingStyle() != null) {
            next.coachingStyle(parseCoachingStyle(request.getCoachingStyle()));
        }
        return toDto(repository.save(next.build()));
    }

    /** Language for prompt directives; never fails a generation because the preference cannot be read. */
    public AiLanguage currentLanguage() {
        try {
            return repository.find().map(AiSettings::getLanguage).orElse(AiLanguage.DEFAULT);
        } catch (RuntimeException e) {
            log.warn("Could not read AI language preference, using {}: {}", AiLanguage.DEFAULT, e.getMessage());
            return AiLanguage.DEFAULT;
        }
    }

    /** Persona for requests that do not pick one; same fallback rules as {@link #currentLanguage()}. */
    public Persona currentCoachingStyle() {
        try {
            return repository.find().map(AiSettings::getCoachingStyle).orElse(Persona.BALANCED_ADVISOR);
        } catch (RuntimeException e) {
            log.warn("Could not read AI coaching style, using {}: {}", Persona.BALANCED_ADVISOR, e.getMessage());
            return Persona.BALANCED_ADVISOR;
        }
    }

    private static Persona parseCoachingStyle(String value) {
        try {
            return Persona.valueOf(value.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported AI coaching style: " + value);
        }
    }

    private AiSettingsDto toDto(AiSettings settings) {
        return AiSettingsDto.builder()
                .language(settings.getLanguage().code())
                .availableLanguages(AVAILABLE_LANGUAGES)
                .coachingStyle(settings.getCoachingStyle().name())
                .availableCoachingStyles(AVAILABLE_COACHING_STYLES)
                .build();
    }
}
