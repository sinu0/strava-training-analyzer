package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pl.strava.analizator.domain.vo.Lap;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class Activity {

    private UUID id;
    private String externalId;
    private String source;
    private String sportType;
    private String name;
    private String description;

    private OffsetDateTime startedAt;
    private Integer elapsedTimeSec;
    private Integer movingTimeSec;

    private BigDecimal distanceM;
    private BigDecimal elevationGainM;
    private BigDecimal elevationLossM;

    private BigDecimal avgSpeedMs;
    private BigDecimal maxSpeedMs;

    private Short avgHeartrate;
    private Short maxHeartrate;

    private Short avgPowerW;
    private Short maxPowerW;

    private Short avgCadence;
    private Short maxCadence;

    private Integer calories;
    private BigDecimal avgTempC;

    private UUID gearId;
    private String summaryPolyline;
    private List<String> photoUrls;

    private List<String> tags;

    // Streams — time-series data for metric calculators
    private int[] powerStream;
    private int[] heartrateStream;
    private int[] cadenceStream;
    private double[] altitudeStream;
    private int[] timeStream;
    private double[] latStream;
    private double[] lngStream;
    private double[] distanceStream;
    private double[] velocityStream;

    private List<Lap> laps;

    private Instant createdAt;
    private Instant updatedAt;

    public boolean hasPowerData() {
        return powerStream != null && powerStream.length > 0;
    }

    public boolean hasHeartrateData() {
        return heartrateStream != null && heartrateStream.length > 0;
    }

    public boolean hasVelocityData() {
        return velocityStream != null && velocityStream.length > 0;
    }

    public boolean hasAltitudeData() {
        return altitudeStream != null && altitudeStream.length > 0;
    }

    public boolean hasGpsData() {
        return latStream != null && latStream.length > 0
                && lngStream != null && lngStream.length > 0;
    }
}
