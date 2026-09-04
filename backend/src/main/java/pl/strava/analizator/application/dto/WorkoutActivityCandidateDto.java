package pl.strava.analizator.application.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;
import pl.strava.analizator.domain.model.Activity;

@Getter
@Setter
public class WorkoutActivityCandidateDto {
    private UUID id;
    private String name;
    private String sportType;
    private OffsetDateTime startedAt;
    private Integer elapsedTimeSec;

    public static WorkoutActivityCandidateDto fromDomain(Activity activity) {
        WorkoutActivityCandidateDto dto = new WorkoutActivityCandidateDto();
        dto.id = activity.getId();
        dto.name = activity.getName();
        dto.sportType = activity.getSportType();
        dto.startedAt = activity.getStartedAt();
        dto.elapsedTimeSec = activity.getElapsedTimeSec();
        return dto;
    }
}
