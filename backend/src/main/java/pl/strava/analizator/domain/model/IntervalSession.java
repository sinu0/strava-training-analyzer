package pl.strava.analizator.domain.model;

import java.util.List;

/**
 * A single detected interval session within recent activities.
 *
 * @param date           when this interval session occurred
 * @param activityId     source activity
 * @param intervalType   THRESHOLD | VO2MAX | ANAEROBIC | NEUROMUSCULAR
 * @param intervalCount  number of intervals detected
 * @param avgDurationSec average duration per interval
 * @param avgPowerPct    average power as % of FTP during work intervals
 * @param totalWorkSec   total time spent working across all intervals
 * @param restRatio      ratio of work:recovery time (lower = more rest)
 * @param qualityScore   0–100 scoring of the session's structure
 */
public record IntervalSession(
        String date,
        String activityId,
        String intervalType,
        int intervalCount,
        int avgDurationSec,
        double avgPowerPct,
        int totalWorkSec,
        double restRatio,
        int qualityScore
) {}
