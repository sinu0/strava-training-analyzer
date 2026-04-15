package pl.strava.analizator.application;

import java.time.Instant;

import lombok.Getter;

@Getter
public class RateLimitException extends RuntimeException {

    private final Instant resetsAt;

    public RateLimitException(Instant resetsAt, Throwable cause) {
        super("API rate limit exceeded. Try again after " + resetsAt, cause);
        this.resetsAt = resetsAt;
    }
}
