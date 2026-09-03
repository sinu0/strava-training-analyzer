package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentEffortDto {
    private UUID id;
    private Long externalId;
    private Long segmentId;
    private String segmentName;
    private UUID activityId;
    private String activityName;
    private OffsetDateTime startedAt;
    private int sequence;
    private Integer startIndex;
    private Integer endIndex;
    private Integer elapsedTimeSec;
    private Integer movingTimeSec;
    private BigDecimal distanceM;
    private Short averagePowerW;
    private Short averageHeartrate;
    private BigDecimal averageSpeedMs;
    private Short averageCadence;
    private BigDecimal elevationGainM;
    private Boolean deviceWatts;
    private int personalRank;
    private Integer differenceToBestSec;
    private boolean recordAtTime;
    private Integer previousBestElapsedTimeSec;
    private String achievementLabel;
    private String routePolyline;
}
