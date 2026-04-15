package pl.strava.analizator.domain.metrics;

public class MetricCalculationException extends RuntimeException {
    public MetricCalculationException(String message) {
        super(message);
    }

    public MetricCalculationException(String message, Throwable cause) {
        super(message, cause);
    }
}
