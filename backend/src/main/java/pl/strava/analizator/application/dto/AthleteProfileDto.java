package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
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
public class AthleteProfileDto {

    private UUID id;
    private String name;
    private String email;
    private Short ftpWatts;
    private Short lthrBpm;
    private Short maxHrBpm;
    private Short restingHrBpm;
    private BigDecimal weightKg;
    private LocalDate dateOfBirth;
    private boolean stravaConnected;
    private Long stravaAthleteId;
    private List<TrainingZoneDto> currentZones;
    private Instant createdAt;
    private Instant updatedAt;
}
