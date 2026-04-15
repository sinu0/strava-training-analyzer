package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WeightGoal {

    private UUID id;
    private BigDecimal targetWeightKg;
    private LocalDate targetDate;
    private Instant createdAt;
    private Instant updatedAt;
}
