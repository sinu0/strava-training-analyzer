package pl.strava.analizator.infrastructure.strava.dto;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

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
@JsonIgnoreProperties(ignoreUnknown = true)
public class StravaActivityDto {

    private Long id;

    private String name;

    private String description;

    @JsonProperty("sport_type")
    private String sportType;

    @JsonProperty("start_date")
    private String startDate;

    @JsonProperty("elapsed_time")
    private Integer elapsedTime;

    @JsonProperty("moving_time")
    private Integer movingTime;

    private BigDecimal distance;

    @JsonProperty("total_elevation_gain")
    private BigDecimal totalElevationGain;

    @JsonProperty("elev_low")
    private BigDecimal elevLow;

    @JsonProperty("elev_high")
    private BigDecimal elevHigh;

    @JsonProperty("average_speed")
    private BigDecimal averageSpeed;

    @JsonProperty("max_speed")
    private BigDecimal maxSpeed;

    @JsonProperty("average_heartrate")
    private BigDecimal averageHeartrate;

    @JsonProperty("max_heartrate")
    private BigDecimal maxHeartrate;

    @JsonProperty("average_watts")
    private BigDecimal averageWatts;

    @JsonProperty("max_watts")
    private BigDecimal maxWatts;

    @JsonProperty("average_cadence")
    private BigDecimal averageCadence;

    @JsonProperty("max_cadence")
    private BigDecimal maxCadence;

    private BigDecimal calories;

    @JsonProperty("average_temp")
    private BigDecimal averageTemp;

    @JsonProperty("gear_id")
    private String gearId;

    @JsonProperty("map")
    private MapData map;

    private List<LapData> laps;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MapData {
        @JsonProperty("summary_polyline")
        private String summaryPolyline;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LapData {
        private String name;

        @JsonProperty("elapsed_time")
        private Integer elapsedTime;

        @JsonProperty("moving_time")
        private Integer movingTime;

        private BigDecimal distance;

        @JsonProperty("average_speed")
        private BigDecimal averageSpeed;

        @JsonProperty("average_heartrate")
        private BigDecimal averageHeartrate;

        @JsonProperty("average_watts")
        private BigDecimal averageWatts;

        @JsonProperty("average_cadence")
        private BigDecimal averageCadence;
    }
}
