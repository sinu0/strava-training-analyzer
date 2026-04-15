package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

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
public class ActivitySummaryDto {

    private UUID id;
    private String externalId;
    private String sportType;
    private String name;
    private OffsetDateTime startedAt;
    private Integer movingTimeSec;
    private BigDecimal distanceM;
    private BigDecimal elevationGainM;
    private Short avgHeartrate;
    private Short avgPowerW;
    private BigDecimal avgSpeedMs;
    private Integer calories;
    private String summaryPolyline;
    private List<String> photoUrls;
}
