package pl.strava.analizator.application.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BackfillStatusDto {
    private String jobType;
    private String status;
    private int processed;
    private int total;
    private String capability;
    private Instant rateLimitResetsAt;
    private String errorMessage;
    private Instant updatedAt;
}
