package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataQualitySummaryDto {
    private long totalActivities;
    private long assessedActivities;
    private long available;
    private long partial;
    private long unknown;
}
