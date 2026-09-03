package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentDetailDto {
    private SegmentSummaryDto segment;
    private List<SegmentEffortDto> efforts;
    private String backfillStatus;
    private boolean personalBestConfirmed;
}
