package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WorkoutTemplate {
    private final UUID id;
    private final String name;
    private final WorkoutCategory category;
    private final String description;
    private final BigDecimal targetTss;
    private final int targetDurationMin;
    private final int relativeEffort;
    private final BigDecimal intensityFactor;
    private final List<WorkoutStep> steps;
    private final String createdBy;
    private final OffsetDateTime createdAt;
}
