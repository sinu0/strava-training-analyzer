package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
public class WeightGoalDto {

    private UUID id;
    private BigDecimal targetWeightKg;
    private LocalDate targetDate;
    private Instant createdAt;
    private Instant updatedAt;
}
