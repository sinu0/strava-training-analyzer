package pl.strava.analizator.application.dto;

import java.util.List;

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
public class WeeklyBriefDto {
    private String status;
    private String statusDescription;
    private double weeklyHours;
    private double weeklyTss;
    private double avg4WeekHours;
    private double avg4WeekTss;
    private double efTrend;
    private int fatigueScore;
    private int fatigueLastWeek;
    private String fatigueTrend;
    private String eventName;
    private int daysToEvent;
    private double projectedCtl;
    private String suggestedFocus;
    private double loadFocusLowPct;
    private double loadFocusHighPct;
    private double loadFocusAnaerobicPct;
}
