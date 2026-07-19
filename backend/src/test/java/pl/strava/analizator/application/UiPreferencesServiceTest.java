package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.DashboardWidgetDto;
import pl.strava.analizator.application.dto.DashboardLayoutDto;
import pl.strava.analizator.application.dto.UiPreferencesDto;
import pl.strava.analizator.domain.model.UiPreferences;
import pl.strava.analizator.domain.port.UiPreferencesRepository;

@ExtendWith(MockitoExtension.class)
class UiPreferencesServiceTest {

    @Mock
    private UiPreferencesRepository repository;

    @InjectMocks
    private UiPreferencesService service;

    @Test
    void returnsDefaultPreferencesWhenNothingWasSaved() {
        when(repository.find()).thenReturn(Optional.empty());

        UiPreferencesDto result = service.getPreferences();

        assertThat(result.getSchemaVersion()).isEqualTo(1);
        assertThat(result.getRevision()).isZero();
        assertThat(result.getDashboard().getWidgets())
                .extracting(DashboardWidgetDto::getType)
                .containsExactly("decision", "lastActivity", "recovery", "load", "nextWorkout", "weather");
        assertThat(result.getDashboard().getWidgets())
                .extracting(DashboardWidgetDto::getSpan)
                .containsExactly(8, 4, 4, 4, 6, 6);
        assertThat(result.getMobileNavigation())
                .containsExactly("/", "/activities", "/analytics", "/training");
    }

    @Test
    void savesKnownWidgetsAndSkipsUnknownOnes() {
        when(repository.find()).thenReturn(Optional.of(UiPreferences.defaults()));
        when(repository.save(any(UiPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UiPreferencesDto request = UiPreferencesDto.builder()
                .schemaVersion(1)
                .revision(0)
                .dashboard(DashboardLayoutDto.builder()
                        .widgets(List.of(
                                widget("main", "decision", 0, 12),
                                widget("future", "unknown-widget", 1, 6)))
                        .build())
                .mobileNavigation(List.of("/", "/routes", "/analytics", "/training"))
                .build();

        UiPreferencesDto result = service.updatePreferences(request);

        assertThat(result.getRevision()).isEqualTo(1);
        assertThat(result.getDashboard().getWidgets())
                .extracting(DashboardWidgetDto::getId)
                .containsExactly("main");
        assertThat(result.getWarnings()).containsExactly("Pominięto nieznany widget: unknown-widget");
        verify(repository).save(any(UiPreferences.class));
    }

    @Test
    void rejectsStaleRevision() {
        when(repository.find()).thenReturn(Optional.of(
                UiPreferences.defaults().toBuilder().revision(3).build()));
        UiPreferencesDto request = UiPreferencesDto.builder()
                .schemaVersion(1)
                .revision(2)
                .dashboard(DashboardLayoutDto.builder().widgets(List.of()).build())
                .mobileNavigation(List.of("/", "/activities", "/analytics", "/training"))
                .build();

        assertThatThrownBy(() -> service.updatePreferences(request))
                .isInstanceOf(UiPreferencesConflictException.class)
                .hasMessageContaining("revision 3");
    }

    @Test
    void rejectsDuplicateWidgetIds() {
        when(repository.find()).thenReturn(Optional.of(UiPreferences.defaults()));
        UiPreferencesDto request = UiPreferencesDto.builder()
                .schemaVersion(1)
                .revision(0)
                .dashboard(DashboardLayoutDto.builder()
                        .widgets(List.of(
                                widget("duplicate", "decision", 0, 12),
                                widget("duplicate", "weather", 1, 6)))
                        .build())
                .mobileNavigation(List.of("/", "/activities", "/analytics", "/training"))
                .build();

        assertThatThrownBy(() -> service.updatePreferences(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unikalne");
    }

    private DashboardWidgetDto widget(String id, String type, int order, int span) {
        return DashboardWidgetDto.builder()
                .id(id)
                .type(type)
                .order(order)
                .span(span)
                .settings(Map.of())
                .build();
    }
}
