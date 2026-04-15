package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarActivitySummaryDto {
    private UUID id;
    private String name;
    private String sportType;
    private Integer durationMin;
    private BigDecimal distanceKm;
    private BigDecimal tss;
}
