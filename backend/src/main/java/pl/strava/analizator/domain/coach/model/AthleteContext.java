package pl.strava.analizator.domain.coach.model;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AthleteContext {
    private final double ctl;
    private final double atl;
    private final double tsb;
    private final double trainingMonotony;
    private final double readinessScore;
    private final double hrvRmssd;
    private final double baselineHrv;
    private final double restingHr;
    private final double baselineRestingHr;
    private final double sleepScore;
    private final double bodyBattery;
    private final double stressAvg;
    private final int timeAvailableMinutes;
    private final int weatherScore;
    private final String weatherDescription;
    private final List<String> recentSessionOutcomes;
    private final Map<String, Double> metricValues;
    private final boolean hasHrvData;
    private final boolean hasWeatherData;
    private final boolean hasRecentActivities;
    private final int completedRecentSessions;
    private final int expectedRecentSessions;
}
