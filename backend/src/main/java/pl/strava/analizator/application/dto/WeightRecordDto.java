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
public class WeightRecordDto {

    private UUID id;
    private BigDecimal weightKg;
    private LocalDate recordedDate;
    private String notes;
    private Instant createdAt;
}
