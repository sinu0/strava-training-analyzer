package pl.strava.analizator.domain.metrics;

import java.util.List;

import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Calculator for metrics computed from a time series of daily training loads.
 * E.g. CTL/ATL/TSB, monotony, power curve.
 */
public interface TimeSeriesMetricCalculator<T> {
    String metricName();
    T calculate(List<DailyTrainingLoad> history, AthleteProfile profile);
}
