package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "athlete_profile")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AthleteProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email")
    private String email;

    @Column(name = "ftp_watts")
    private Short ftpWatts;

    @Column(name = "lthr_bpm")
    private Short lthrBpm;

    @Column(name = "max_hr_bpm")
    private Short maxHrBpm;

    @Column(name = "resting_hr_bpm")
    private Short restingHrBpm;

    @Column(name = "weight_kg")
    private BigDecimal weightKg;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "strava_athlete_id", unique = true)
    private Long stravaAthleteId;

    @Column(name = "strava_access_token", columnDefinition = "TEXT")
    private String stravaAccessToken;

    @Column(name = "strava_refresh_token", columnDefinition = "TEXT")
    private String stravaRefreshToken;

    @Column(name = "strava_token_expires")
    private Instant stravaTokenExpires;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
