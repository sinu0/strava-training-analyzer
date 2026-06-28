package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
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
public class SaveEquipmentRequest {

    private String name;
    private String type;
    private String brand;
    private String model;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private Integer replacementIntervalKm;
    private Double totalKm;
    private String notes;
}
