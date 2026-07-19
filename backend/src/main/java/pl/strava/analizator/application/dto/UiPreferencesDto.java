package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UiPreferencesDto {
    private int schemaVersion;
    private long revision;
    private DashboardLayoutDto dashboard;
    @Builder.Default
    private List<String> mobileNavigation = List.of();
    @Builder.Default
    private List<String> warnings = List.of();
}
