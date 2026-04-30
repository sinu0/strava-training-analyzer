package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessCheckInDto {
    private LocalDate date;
    private Short sleepQuality;
    private Short legFreshness;
    private Short motivation;
    private Short soreness;
    private Integer scoreAdjustment;
    private Instant updatedAt;
}
