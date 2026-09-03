package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentSummaryDto {
    private Long id;
    private String name;
    private String activityType;
    private BigDecimal distanceM;
    private BigDecimal averageGrade;
    private BigDecimal maximumGrade;
    private BigDecimal elevationHighM;
    private BigDecimal elevationLowM;
    private Double startLatitude;
    private Double startLongitude;
    private Double endLatitude;
    private Double endLongitude;
    private String city;
    private String country;
    private boolean localFavorite;
    private String routePolyline;
    private int effortCount;
    private Integer bestElapsedTimeSec;
    private OffsetDateTime latestEffortAt;
}
