package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AthleteProfile {

    private UUID id;
    private String name;
    private String email;
    private Short ftpWatts;
    private Short lthrBpm;
    private Short maxHrBpm;
    private Short restingHrBpm;
    private BigDecimal weightKg;
    private LocalDate dateOfBirth;

    private Long stravaAthleteId;
    private String stravaAccessToken;
    private String stravaRefreshToken;
    private Instant stravaTokenExpires;

    private Instant createdAt;
    private Instant updatedAt;

    public boolean hasStrava() {
        return stravaAthleteId != null;
    }

    public boolean hasFtp() {
        return ftpWatts != null && ftpWatts > 0;
    }

    public boolean hasLthr() {
        return lthrBpm != null && lthrBpm > 0;
    }
}
