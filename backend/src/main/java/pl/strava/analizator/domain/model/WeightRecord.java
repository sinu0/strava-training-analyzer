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
public class WeightRecord {

    private UUID id;
    private BigDecimal weightKg;
    private LocalDate recordedDate;
    private String notes;
    private Instant createdAt;
}
