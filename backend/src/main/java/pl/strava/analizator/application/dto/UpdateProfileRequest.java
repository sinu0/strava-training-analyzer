package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class UpdateProfileRequest {

    private String name;

    @Min(100) @Max(500)
    private Short ftpWatts;

    @Min(100) @Max(220)
    private Short lthrBpm;

    @Min(120) @Max(250)
    private Short maxHrBpm;

    @Min(30) @Max(100)
    private Short restingHrBpm;

    @Positive
    private BigDecimal weightKg;

    private LocalDate dateOfBirth;
}
