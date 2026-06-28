package pl.strava.analizator.application.dto;

import java.time.Instant;
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
public class ChallengeDto {

    private UUID id;
    private String name;
    private String description;
    private String type;
    private double targetValue;
    private String targetUnit;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private double currentValue;
    private double progressPercent;
    private long daysLeft;
    private Instant completedAt;
    private Instant createdAt;
}
