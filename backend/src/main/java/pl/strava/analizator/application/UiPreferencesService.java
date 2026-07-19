package pl.strava.analizator.application;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.DashboardLayoutDto;
import pl.strava.analizator.application.dto.DashboardWidgetDto;
import pl.strava.analizator.application.dto.UiPreferencesDto;
import pl.strava.analizator.domain.model.DashboardWidget;
import pl.strava.analizator.domain.model.UiPreferences;
import pl.strava.analizator.domain.port.UiPreferencesRepository;

@Service
@RequiredArgsConstructor
public class UiPreferencesService {

    private static final int CURRENT_SCHEMA_VERSION = 1;
    private static final Set<String> WIDGET_TYPES = Set.of(
            "decision", "recovery", "load", "lastActivity", "nextWorkout", "weather",
            "weeklyVolume", "goal");
    private static final Set<String> NAVIGATION_PATHS = Set.of(
            "/", "/activities", "/analytics", "/training", "/routes");

    private final UiPreferencesRepository repository;

    @Transactional(readOnly = true)
    public UiPreferencesDto getPreferences() {
        return toDto(repository.find().orElseGet(UiPreferences::defaults), List.of());
    }

    @Transactional
    public UiPreferencesDto updatePreferences(UiPreferencesDto request) {
        validateEnvelope(request);
        UiPreferences current = repository.find().orElseGet(UiPreferences::defaults);
        if (request.getRevision() != current.getRevision()) {
            throw new UiPreferencesConflictException(
                    "Preferencje zostały zmienione; aktualna revision " + current.getRevision());
        }

        List<String> warnings = new ArrayList<>();
        List<DashboardWidget> widgets = sanitizeWidgets(request.getDashboard().getWidgets(), warnings);
        validateNavigation(request.getMobileNavigation());

        UiPreferences next = UiPreferences.builder()
                .schemaVersion(CURRENT_SCHEMA_VERSION)
                .revision(current.getRevision() + 1)
                .widgets(widgets)
                .mobileNavigation(List.copyOf(request.getMobileNavigation()))
                .build();
        return toDto(repository.save(next), warnings);
    }

    private void validateEnvelope(UiPreferencesDto request) {
        if (request == null || request.getDashboard() == null) {
            throw new IllegalArgumentException("Dashboard preferencji jest wymagany");
        }
        if (request.getSchemaVersion() != CURRENT_SCHEMA_VERSION) {
            throw new IllegalArgumentException("Nieobsługiwana wersja schematu preferencji");
        }
    }

    private List<DashboardWidget> sanitizeWidgets(
            List<DashboardWidgetDto> requestedWidgets,
            List<String> warnings) {
        List<DashboardWidgetDto> source = requestedWidgets != null ? requestedWidgets : List.of();
        Set<String> ids = new HashSet<>();
        List<DashboardWidget> result = new ArrayList<>();
        for (DashboardWidgetDto widget : source) {
            if (widget.getId() == null || widget.getId().isBlank() || !ids.add(widget.getId())) {
                throw new IllegalArgumentException("Identyfikatory widgetów muszą być niepuste i unikalne");
            }
            if (!WIDGET_TYPES.contains(widget.getType())) {
                warnings.add("Pominięto nieznany widget: " + widget.getType());
                continue;
            }
            if (widget.getSpan() < 1 || widget.getSpan() > 12) {
                throw new IllegalArgumentException("Szerokość widgetu musi mieścić się w zakresie 1-12");
            }
            result.add(DashboardWidget.builder()
                    .id(widget.getId())
                    .type(widget.getType())
                    .order(result.size())
                    .span(widget.getSpan())
                    .settings(widget.getSettings() != null ? Map.copyOf(widget.getSettings()) : Map.of())
                    .build());
        }
        return List.copyOf(result);
    }

    private void validateNavigation(List<String> navigation) {
        if (navigation == null || navigation.size() != 4) {
            throw new IllegalArgumentException("Nawigacja mobilna musi zawierać dokładnie 4 skróty");
        }
        if (new HashSet<>(navigation).size() != navigation.size()
                || !navigation.stream().allMatch(NAVIGATION_PATHS::contains)) {
            throw new IllegalArgumentException("Skróty nawigacji mobilnej muszą być unikalne i obsługiwane");
        }
    }

    private UiPreferencesDto toDto(UiPreferences preferences, List<String> warnings) {
        List<DashboardWidgetDto> widgets = preferences.getWidgets().stream()
                .map(widget -> DashboardWidgetDto.builder()
                        .id(widget.getId())
                        .type(widget.getType())
                        .order(widget.getOrder())
                        .span(widget.getSpan())
                        .settings(widget.getSettings())
                        .build())
                .toList();
        return UiPreferencesDto.builder()
                .schemaVersion(preferences.getSchemaVersion())
                .revision(preferences.getRevision())
                .dashboard(DashboardLayoutDto.builder().widgets(widgets).build())
                .mobileNavigation(preferences.getMobileNavigation())
                .warnings(List.copyOf(warnings))
                .build();
    }
}
