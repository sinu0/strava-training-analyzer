package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingStatusDto {
    private String status;
    private String label;
    private String description;
    private double ctlTrend;
    private double currentCtl;
    private double currentTsb;
    private int fatigue;
}
