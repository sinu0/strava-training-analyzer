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
public class GarminDailySummaryDto {

    @JsonProperty("totalSteps")
    private Integer steps;

    @JsonProperty("activeKilocalories")
    private Integer activeCalories;

    @JsonProperty("moderateIntensityMinutes")
    private Integer moderateIntensityMinutes;

    @JsonProperty("vigorousIntensityMinutes")
    private Integer vigorousIntensityMinutes;

    @JsonProperty("floorsAscended")
    private Integer floorsAscended;

    @JsonProperty("averageStressLevel")
    private Integer stressAvg;

    @JsonProperty("restingHeartRate")
    private Integer restingHeartRate;

    @JsonProperty("bodyBatteryMostRecentValue")
    private Integer bodyBattery;
}
