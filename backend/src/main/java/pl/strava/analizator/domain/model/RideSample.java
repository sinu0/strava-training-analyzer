package pl.strava.analizator.domain.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

/** One recorded second of an indoor ride (trainer mode). Missing sensors are null. */
@Value
@Builder(toBuilder = true)
public class RideSample {
    Instant at;
    long elapsedMs;
    int stepIndex;
    Integer powerWatts;
    Integer heartRateBpm;
    Integer cadenceRpm;
    Double speedKph;
}
