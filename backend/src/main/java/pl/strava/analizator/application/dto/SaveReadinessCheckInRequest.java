package pl.strava.analizator.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

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
public class SaveReadinessCheckInRequest {
    @NotNull
    @Min(1)
    @Max(5)
    private Short sleepQuality;

    @NotNull
    @Min(1)
    @Max(5)
    private Short legFreshness;

    @NotNull
    @Min(1)
    @Max(5)
    private Short motivation;

    @NotNull
    @Min(1)
    @Max(5)
    private Short soreness;
}
