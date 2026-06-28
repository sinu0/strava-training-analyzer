package pl.strava.analizator.domain.equipment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Equipment {

    private UUID id;
    private String name;
    private EquipmentType type;
    private String brand;
    private String model;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private Integer replacementIntervalKm;
    private double totalKm;
    private EquipmentStatus status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
