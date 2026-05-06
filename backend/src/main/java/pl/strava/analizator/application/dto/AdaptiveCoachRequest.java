package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
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
public class AdaptiveCoachRequest {
    private String goalType;
    private String targetMetric;
    private Double targetValue;
    private Double currentValue;
    private String goalContext;
    private LocalDate deadline;
    private Double progressPerWeek;
    private String aiInput;
    private String overrideState;
    private Double ctl;
    private Double atl;
    private Double tsb;
    private Double trainingMonotony;
    private Double readinessScore;
    private Double hrvRmssd;
    private Double baselineHrv;
    private Double restingHr;
    private Double baselineRestingHr;
    private Double sleepScore;
    private Double bodyBattery;
    private Double stressAvg;
    private Integer timeAvailableMinutes;
    private Integer weatherScore;
    private String weatherDescription;
    private List<String> recentSessionOutcomes;
    private Boolean hasHrvData;
    private Boolean hasWeatherData;
    private Boolean hasRecentActivities;
    private Integer completedRecentSessions;
    private Integer expectedRecentSessions;
    private Double ftp;
    private Double vo2maxEstimate;
    private Double durabilityIndex;
    private Double weightKg;
}
