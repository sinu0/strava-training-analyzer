package pl.strava.analizator.application;

/**
 * A failure of an external data source that is expected to disappear on its own,
 * such as a lost network route or a temporary 5xx response. Callers retry later.
 */
public class TransientSourceException extends RuntimeException {

    public TransientSourceException(String message, Throwable cause) {
        super(message, cause);
    }
}
