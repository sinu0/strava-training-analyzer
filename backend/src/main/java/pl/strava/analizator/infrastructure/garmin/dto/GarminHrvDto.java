package pl.strava.analizator.infrastructure.garmin.dto;

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
public class GarminHrvDto {

    @JsonProperty("hrvSummary")
    private HrvSummary hrvSummary;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class HrvSummary {

        @JsonProperty("weeklyAvg")
        private Double weeklyAvg;

        @JsonProperty("lastNight")
        private Double lastNight;

        @JsonProperty("lastNightAvg")
        private Double lastNightAvg;

        @JsonProperty("status")
        private String status;
    }
}
