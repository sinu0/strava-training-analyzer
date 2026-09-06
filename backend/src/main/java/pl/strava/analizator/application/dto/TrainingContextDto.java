package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class TrainingContextDto {
    private String timezone;
    private LocalDate asOf;
    @io.swagger.v3.oas.annotations.media.Schema(nullable = true, allowableValues = {"FTP", "ENDURANCE", "CONSISTENCY", "EVENT"})
    private String goalType;
    @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
    private Double targetValue;
    @io.swagger.v3.oas.annotations.media.Schema(nullable = true)
    private LocalDate deadline;
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED)
    private Map<String, Integer> availableMinutes;
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED)
    private List<TrainingConstraintDto> constraints;
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED, allowableValues = {"MIXED", "INDOOR", "OUTDOOR"})
    private String environment;
    @io.swagger.v3.oas.annotations.media.Schema(requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED)
    private long revision;
}
