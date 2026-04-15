package pl.strava.analizator.domain.port;

import pl.strava.analizator.domain.model.WorkoutTemplate;

public interface WorkoutFileExporter {

    byte[] encodeAsZwo(WorkoutTemplate template, int ftpWatts);

    byte[] encodeAsFit(WorkoutTemplate template, int ftpWatts);
}
