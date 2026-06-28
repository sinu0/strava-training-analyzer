package pl.strava.analizator.domain.challenge;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Challenge {

    private UUID id;
    private String name;
    private String description;
    private ChallengeType type;
    private double targetValue;
    private String targetUnit;
    private LocalDate startDate;
    private LocalDate endDate;
    private ChallengeStatus status;
    private Instant completedAt;
    private Instant createdAt;
}
