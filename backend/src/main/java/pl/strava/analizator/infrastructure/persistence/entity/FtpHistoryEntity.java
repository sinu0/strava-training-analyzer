package pl.strava.analizator.infrastructure.persistence.entity;

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
@Table(name = "ftp_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FtpHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ftp_watts", nullable = false)
    private Short ftpWatts;

    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "test_date", nullable = false)
    private LocalDate testDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;
}
