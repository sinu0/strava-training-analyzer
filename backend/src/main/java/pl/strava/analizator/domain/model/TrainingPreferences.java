package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TrainingPreferences {
    private String goalType;
    private Double targetValue;
    private LocalDate deadline;
    @Builder.Default private Map<String, Integer> availableMinutes = Map.of();
    @Builder.Default private List<TrainingConstraint> constraints = List.of();
    @Builder.Default private String environment = "MIXED";
    private long revision;
}
