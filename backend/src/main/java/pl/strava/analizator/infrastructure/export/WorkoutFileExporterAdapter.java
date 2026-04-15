package pl.strava.analizator.infrastructure.export;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.WorkoutFileExporter;

@Component
public class WorkoutFileExporterAdapter implements WorkoutFileExporter {

    @Override
    public byte[] encodeAsZwo(WorkoutTemplate template, int ftpWatts) {
        return ZwoEncoder.encode(template);
    }

    @Override
    public byte[] encodeAsFit(WorkoutTemplate template, int ftpWatts) {
        return FitWorkoutEncoder.encode(template);
    }
}
