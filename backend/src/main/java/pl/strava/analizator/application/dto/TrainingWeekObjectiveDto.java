package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TrainingWeekObjectiveDto {
    private LocalDate weekStart;
    private LocalDate weekEnd;
    private String objectiveType;
    private String label;
    private String focus;
    private BigDecimal plannedTss;
    private int maxQualityDays;
    private List<String> keySessionTypes;
    private String fuelingLabel;
    private String fuelingGuidance;
}
