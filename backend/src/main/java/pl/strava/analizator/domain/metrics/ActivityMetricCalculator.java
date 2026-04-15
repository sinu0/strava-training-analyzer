package pl.strava.analizator.domain.metrics;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Calculator for a metric computed from a single activity.
 * E.g. NP, TSS, IF, time in zones.
 */
public interface ActivityMetricCalculator<T> {
    String metricName();
    T calculate(Activity activity, AthleteProfile profile);
    boolean supports(Activity activity);
}
