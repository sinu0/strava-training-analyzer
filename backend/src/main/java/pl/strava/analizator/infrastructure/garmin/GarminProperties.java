package pl.strava.analizator.infrastructure.garmin;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "garmin")
public record GarminProperties(
        boolean enabled,
        int syncIntervalHours
) {
}
