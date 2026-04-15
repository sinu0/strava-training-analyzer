package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FtpRecord {

    private UUID id;
    private Short ftpWatts;
    private String source;
    private LocalDate testDate;
    private String notes;
    private Instant createdAt;
}
