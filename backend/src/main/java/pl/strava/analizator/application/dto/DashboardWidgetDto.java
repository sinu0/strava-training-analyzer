package pl.strava.analizator.application.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardWidgetDto {
    private String id;
    private String type;
    private int order;
    private int span;
    @Builder.Default
    private Map<String, Object> settings = Map.of();
}
