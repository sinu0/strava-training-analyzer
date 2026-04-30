package pl.strava.analizator.application.dto;

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
public class ReadinessSessionVariantDto {

    private String title;
    private int durationMinutes;
    private String targetPower;
    private int targetTss;
    private String fuelingHint;
    private String recoveryHint;
}
