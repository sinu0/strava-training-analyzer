package pl.strava.analizator.infrastructure.strava;

import java.time.Instant;

public class RateLimitException extends pl.strava.analizator.application.RateLimitException {

    public RateLimitException(Instant resetsAt, Throwable cause) {
        super(resetsAt, cause);
    }
}
