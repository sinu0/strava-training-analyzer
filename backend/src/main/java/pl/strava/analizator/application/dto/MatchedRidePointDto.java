package pl.strava.analizator.application.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MatchedRidePointDto {
    private UUID activityId;
    private String activityName;
    private OffsetDateTime startedAt;
    private Double averageSpeedKmh;
    private Integer movingTimeSec;
    private Short averagePowerW;
    private Short averageHeartrate;
    private Integer relativeEffort;
    private double similarityPercent;
    private Double smoothedSpeedKmh;
}
