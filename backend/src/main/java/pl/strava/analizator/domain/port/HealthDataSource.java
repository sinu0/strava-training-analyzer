package pl.strava.analizator.domain.port;

import java.time.LocalDate;

import pl.strava.analizator.domain.model.DailySummary;

/**
 * Abstraction over external health data sources (Garmin, etc.).
 */
public interface HealthDataSource {

    String sourceName();

    DailySummary fetchDailyHealth(LocalDate date);
}
