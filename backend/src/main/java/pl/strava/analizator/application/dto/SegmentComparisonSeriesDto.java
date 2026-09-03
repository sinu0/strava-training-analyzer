package pl.strava.analizator.application.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentComparisonSeriesDto {
    private UUID effortId;
    private UUID activityId;
    private String activityName;
    private OffsetDateTime startedAt;
    private Integer elapsedTimeSec;
    private List<SegmentComparisonPointDto> points;
}
