package pl.strava.analizator.domain.ai;

/**
 * Port for aggregating historical training data into a context for the LLM.
 * Application layer implements this by pulling from existing repositories/services.
 */
public interface TrainingDataPort {

    /**
     * Builds a complete training context with historical data
     * relevant for the given prediction type.
     */
    TrainingContext buildContext(PredictionType predictionType);
}
