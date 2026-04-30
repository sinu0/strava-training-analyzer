package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DurabilityWorkoutDto {
    private UUID activityId;
    private LocalDate date;
    private String name;
    private Integer durationMin;
    private BigDecimal tss;
    private BigDecimal aerobicDecoupling;
    private BigDecimal powerFade;
    private Integer durabilityScore;
}
