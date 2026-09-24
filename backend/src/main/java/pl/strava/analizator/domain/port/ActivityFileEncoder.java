package pl.strava.analizator.domain.port;

import java.util.List;

import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.model.WorkoutExecution;

/** Encodes a recorded ride as an activity file (FIT) for Garmin Connect or Strava upload. */
public interface ActivityFileEncoder {
    byte[] encode(WorkoutExecution execution, List<RideSample> samples);
}
