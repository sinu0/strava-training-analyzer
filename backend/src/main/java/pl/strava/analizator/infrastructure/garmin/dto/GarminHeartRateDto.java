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
public class GarminHeartRateDto {

    @JsonProperty("restingHeartRate")
    private Integer restingHeartRate;

    @JsonProperty("maxHeartRate")
    private Integer maxHeartRate;

    @JsonProperty("minHeartRate")
    private Integer minHeartRate;
}
