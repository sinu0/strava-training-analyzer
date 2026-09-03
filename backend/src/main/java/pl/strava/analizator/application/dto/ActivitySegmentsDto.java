package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ActivitySegmentsDto {
    private UUID activityId;
    private String routePolyline;
    private String availability;
    private String backfillStatus;
    private boolean personalBestConfirmed;
    private List<SegmentEffortDto> efforts;
}
