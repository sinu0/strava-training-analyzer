package pl.strava.analizator.domain.model;

/**
 * Extended durability analysis — how well the athlete resists fatigue
 * across different exercise durations.
 *
 * @param overallScore           0–100 composite durability score
 * @param trend                  IMPROVING | STABLE | DECLINING | NO_DATA
 * @param label                  human-readable summary
 * @param description            detailed description
 * @param shortDurationResistance    fatigue resistance at 20–45 min (decoupling over short efforts)
 * @param mediumDurationResistance   fatigue resistance at 45–90 min
 * @param longDurationResistance     fatigue resistance at 90+ min
 * @param avgAerobicDecoupling   average decoupling across all qualifying rides
 * @param avgPowerFade           average power fade across all qualifying rides
 * @param fatigueResistanceIndex FRI: ratio of 60-min best power to 20-min best power (higher = better endurance)
 * @param recentWorkoutsCount    number of qualifying long rides in the last 90 days
 * @param recommendation         what to focus on to improve durability
 */
public record DurabilityProfile(
        int overallScore,
        String trend,
        String label,
        String description,
        int shortDurationResistance,
        int mediumDurationResistance,
        int longDurationResistance,
        double avgAerobicDecoupling,
        double avgPowerFade,
        double fatigueResistanceIndex,
        int recentWorkoutsCount,
        String recommendation
) {}
