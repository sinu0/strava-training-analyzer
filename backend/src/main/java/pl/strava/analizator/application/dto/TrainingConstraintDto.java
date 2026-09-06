package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import lombok.Data;

@Data
public class TrainingConstraintDto {
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED)
    private LocalDate from;
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED)
    private LocalDate to;
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED, allowableValues = {"BLOCKED", "RETURN_TO_TRAINING"})
    private String type;
    @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
    private String note;
}
