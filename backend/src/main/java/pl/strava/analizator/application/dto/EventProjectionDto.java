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
public class EventProjectionDto {
    private String eventName;
    private int daysToEvent;
    private double currentCtl;
    private double projectedCtl;
    private double currentTsb;
    private int fatigueScore;
    private String suggestedTaper;
    private int taperStartDays;
}
