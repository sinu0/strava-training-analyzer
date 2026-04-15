package pl.strava.analizator.application.dto;

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
public class TrainingZoneDto {

    private UUID id;
    private String zoneType;
    private Short zoneNumber;
    private String zoneName;
    private Short minValue;
    private Short maxValue;
    private String color;
    private LocalDate validFrom;
    private LocalDate validTo;
}