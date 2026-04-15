package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TrainingZone {

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
