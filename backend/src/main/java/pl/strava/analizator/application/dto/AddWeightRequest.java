package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

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
public class AddWeightRequest {

    @NotNull
    @Positive
    private BigDecimal weightKg;

    @NotNull
    private LocalDate recordedDate;

    private String notes;
}
