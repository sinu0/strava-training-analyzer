package pl.strava.analizator.application;

import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.WorkoutFileExporter;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;

@Service
@RequiredArgsConstructor
public class WorkoutExportService {

    private static final int DEFAULT_FTP = 200;

    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final WorkoutFileExporter workoutFileExporter;

    public byte[] exportAsZwo(UUID templateId) {
        WorkoutTemplate template = findTemplate(templateId);
        int ftp = getAthleteFtp();
        return workoutFileExporter.encodeAsZwo(template, ftp);
    }

    public byte[] exportAsFit(UUID templateId) {
        WorkoutTemplate template = findTemplate(templateId);
        int ftp = getAthleteFtp();
        return workoutFileExporter.encodeAsFit(template, ftp);
    }

    private WorkoutTemplate findTemplate(UUID templateId) {
        return workoutTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Workout template not found: " + templateId));
    }

    private int getAthleteFtp() {
        return athleteProfileRepository.findFirst()
                .map(p -> p.getFtpWatts() != null ? p.getFtpWatts().intValue() : DEFAULT_FTP)
                .orElse(DEFAULT_FTP);
    }
}
