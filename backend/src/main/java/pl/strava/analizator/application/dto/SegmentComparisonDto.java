package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentComparisonDto {
    private Long segmentId;
    private UUID referenceEffortId;
    private double distanceM;
    private List<SegmentComparisonSeriesDto> series;
}
