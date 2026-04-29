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
public class BlockHealthDto {
    private String status;
    private String label;
    private String description;
    private String objectiveLabel;
    private String programGoal;
    private String goalExecutionStatus;
    private Integer goalExecutionScore;
    private int adjustmentDays;
    private int missedStimulusDays;
    private int overloadDays;
    private List<String> keySignals;
    private String nextFocus;
}
