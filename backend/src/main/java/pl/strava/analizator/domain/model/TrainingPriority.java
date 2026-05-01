package pl.strava.analizator.domain.model;

/**
 * A single training priority item, ranked by estimated performance ROI.
 */
public record TrainingPriority(
        /** Rank 1-5 (1 = highest priority) */
        int rank,
        /** Short title of the recommendation */
        String title,
        /** Which subsystem produced this priority: cp_wprime | intervals | fatigue | durability | phenotype */
        String subsystem,
        /** Estimated weekly hours to invest */
        int weeklyHours,
        /** Estimated performance impact 0-100 (essentially ROI) */
        int impactScore,
        /** Why this was chosen */
        String rationale,
        /** Concrete training action to take */
        String action,
        /** Supporting metrics display key-value pairs */
        String metricsSummary
) {}
