package pl.strava.analizator.infrastructure.strava;

import pl.strava.analizator.application.TransientSourceException;

public class StravaTransientException extends TransientSourceException {

    public StravaTransientException(String message, Throwable cause) {
        super(message, cause);
    }
}
