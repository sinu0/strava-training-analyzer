package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class Segment {

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
    private String state;
    private String country;
    private boolean privateSegment;
    private boolean localFavorite;
    private String routePolyline;
    private int effortCount;
    private Integer bestElapsedTimeSec;
    private OffsetDateTime latestEffortAt;
    private Instant createdAt;
    private Instant updatedAt;
}
