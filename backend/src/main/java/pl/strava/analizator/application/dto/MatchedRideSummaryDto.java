package pl.strava.analizator.application.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MatchedRideSummaryDto {
    private UUID routeGroupId;
    private UUID routeFamilyId;
    private int rideCount;
    private int currentRank;
    private double similarityPercent;
    private Double currentSpeedKmh;
    private Double changeFromPreviousKmh;
    private Double changeFromAverageKmh;
    private Double changeFromRecordKmh;
    private Double changeFromPreviousBestKmh;
    private boolean newRecord;
    private String directionVariant;
    private List<MatchedRidePointDto> trend;
}
