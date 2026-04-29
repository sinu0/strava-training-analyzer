package pl.strava.analizator.domain.ai;

/**
 * Types of AI predictions available in the system.
 * Each type maps to a predefined prompt template.
 */
public enum PredictionType {

    FTP_PREDICTION,
    FATIGUE_PREDICTION,
    TRAINING_TYPE_RECOMMENDATION,
    PERFORMANCE_TREND,
    OVERTRAINING_RISK,
    RACE_READINESS,
    TRAINING_COACH_SUMMARY
}
