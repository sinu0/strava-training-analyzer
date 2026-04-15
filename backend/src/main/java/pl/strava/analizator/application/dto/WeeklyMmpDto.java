package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.Map;

/**
 * Weekly Maximal Mean Power: best efforts per standard duration for one ISO week.
 *
 * @param weekLabel   human-readable label, e.g. "2024-W03"
 * @param weekStart   Monday of the ISO week
 * @param bestEfforts duration label (e.g. "5s", "1min") → best watts that week
 */
public record WeeklyMmpDto(
        String weekLabel,
        LocalDate weekStart,
        Map<String, Integer> bestEfforts
) {}
