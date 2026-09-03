package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class SegmentEffort {

    private UUID id;
    private Long externalId;
    private Long segmentId;
    private Segment segment;
    private UUID activityId;
    private OffsetDateTime startedAt;
    private int sequence;
    private Integer startIndex;
    private Integer endIndex;
    private Integer elapsedTimeSec;
    private Integer movingTimeSec;
    private BigDecimal distanceM;
    private Short averagePowerW;
    private Short averageHeartrate;
    private Short maxHeartrate;
    private BigDecimal averageSpeedMs;
    private Short averageCadence;
    private BigDecimal elevationGainM;
    private Boolean deviceWatts;
    private Integer stravaPrRank;
    private boolean recordAtTime;
    private Integer previousBestElapsedTimeSec;
    private Instant createdAt;
    private Instant updatedAt;
}
