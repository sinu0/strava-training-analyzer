package pl.strava.analizator.domain.ai;

public record ModelCapability(
        String modelName,
        ModelTier tier,
        boolean supportsToolCalling,
        boolean supportsThinking,
        boolean supportsVision,
        int contextWindow,
        int priority
) {

    public boolean isAvailable() {
        return tier != null;
    }
}
