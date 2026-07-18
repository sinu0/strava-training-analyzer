package pl.strava.analizator.domain.model;

/**
 * Conservative physiological and sensor sanity bounds. Values outside these
 * bounds remain stored, but must not be promoted as records or evidence.
 */
public final class ActivityDataQualityPolicy {

    private ActivityDataQualityPolicy() {}

    public static boolean isPlausiblePower(double watts, int durationSeconds) {
        if (!Double.isFinite(watts) || watts <= 0) return false;
        double upperBound = durationSeconds <= 10 ? 2_500
                : durationSeconds <= 60 ? 1_800
                : durationSeconds <= 300 ? 1_400
                : 1_200;
        return watts <= upperBound;
    }

    public static boolean isPlausibleSpeedKmh(double speedKmh) {
        return Double.isFinite(speedKmh) && speedKmh > 0 && speedKmh <= 120;
    }

    public static boolean isPlausiblePositive(double value, double upperBound) {
        return Double.isFinite(value) && value > 0 && value <= upperBound;
    }
}
