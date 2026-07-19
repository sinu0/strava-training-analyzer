package pl.strava.analizator.domain.model;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class DashboardWidget {
    private String id;
    private String type;
    private int order;
    private int span;
    @Builder.Default
    private Map<String, Object> settings = Map.of();
}
