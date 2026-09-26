package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.AiSettingsDto;
import pl.strava.analizator.domain.ai.AiLanguage;
import pl.strava.analizator.domain.ai.AiSettings;
import pl.strava.analizator.domain.ai.Persona;
import pl.strava.analizator.domain.port.AiSettingsRepository;

@ExtendWith(MockitoExtension.class)
class AiSettingsServiceTest {

    @Mock
    private AiSettingsRepository repository;

    @InjectMocks
    private AiSettingsService service;

    @Test
    void defaultsToPolishWhenNothingSaved() {
        when(repository.find()).thenReturn(Optional.empty());

        assertThat(service.getSettings().getLanguage()).isEqualTo("pl");
        assertThat(service.getSettings().getAvailableLanguages()).containsExactly("pl", "en");
        assertThat(service.currentLanguage()).isEqualTo(AiLanguage.PL);
        assertThat(service.getSettings().getCoachingStyle()).isEqualTo("BALANCED_ADVISOR");
        assertThat(service.getSettings().getAvailableCoachingStyles())
                .containsExactlyInAnyOrder("BALANCED_ADVISOR", "AGGRESSIVE_COACH", "CONSERVATIVE_SCIENTIST");
        assertThat(service.currentCoachingStyle()).isEqualTo(Persona.BALANCED_ADVISOR);
    }

    @Test
    void returnsSavedLanguage() {
        when(repository.find()).thenReturn(Optional.of(AiSettings.builder().language(AiLanguage.EN).build()));

        assertThat(service.getSettings().getLanguage()).isEqualTo("en");
        assertThat(service.currentLanguage()).isEqualTo(AiLanguage.EN);
    }

    @Test
    void updateSavesRequestedLanguage() {
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AiSettingsDto result = service.updateSettings(AiSettingsDto.builder().language("EN").build());

        assertThat(result.getLanguage()).isEqualTo("en");
        verify(repository).save(any(AiSettings.class));
    }

    @Test
    void partialUpdateKeepsTheOtherField() {
        when(repository.find()).thenReturn(Optional.of(AiSettings.builder().language(AiLanguage.EN).build()));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AiSettingsDto result = service.updateSettings(AiSettingsDto.builder().coachingStyle("CONSERVATIVE_SCIENTIST").build());

        assertThat(result.getLanguage()).isEqualTo("en");
        assertThat(result.getCoachingStyle()).isEqualTo("CONSERVATIVE_SCIENTIST");
    }

    @Test
    void updateRejectsUnsupportedCoachingStyle() {
        assertThatThrownBy(() -> service.updateSettings(AiSettingsDto.builder().coachingStyle("YOLO").build()))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void updateRejectsUnsupportedLanguage() {
        assertThatThrownBy(() -> service.updateSettings(AiSettingsDto.builder().language("de").build()))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void currentLanguageFallsBackToDefaultWhenRepositoryFails() {
        when(repository.find()).thenThrow(new IllegalStateException("db down"));

        assertThat(service.currentLanguage()).isEqualTo(AiLanguage.DEFAULT);
    }

    @Test
    void directivesNameTheLanguage() {
        assertThat(AiLanguage.PL.promptDirective()).contains("Polish");
        assertThat(AiLanguage.EN.promptDirective()).contains("English");
    }
}
