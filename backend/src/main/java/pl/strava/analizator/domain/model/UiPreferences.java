package pl.strava.analizator.domain.model;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class UiPreferences {
    private int schemaVersion;
    private long revision;
    @Builder.Default
    private List<DashboardWidget> widgets = List.of();
    @Builder.Default
    private List<String> mobileNavigation = List.of();

    public static UiPreferences defaults() {
        return UiPreferences.builder()
                .schemaVersion(1)
                .revision(0)
                .widgets(List.of(
                        widget("decision-main", "decision", 0, 12),
                        widget("recovery-main", "recovery", 1, 4),
                        widget("load-main", "load", 2, 4),
                        widget("last-activity-main", "lastActivity", 3, 4),
                        widget("next-workout-main", "nextWorkout", 4, 6),
                        widget("weather-main", "weather", 5, 6)))
                .mobileNavigation(List.of("/", "/activities", "/analytics", "/training"))
                .build();
    }

    private static DashboardWidget widget(String id, String type, int order, int span) {
        return DashboardWidget.builder()
                .id(id)
                .type(type)
                .order(order)
                .span(span)
                .settings(Map.of())
                .build();
    }
}
