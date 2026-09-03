package pl.strava.analizator.domain.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class AnalysisBackfillState {

    private String jobType;
    private String status;
    private int processed;
    private int total;
    private String capability;
    private Instant rateLimitResetsAt;
    private String errorMessage;
    private Instant startedAt;
    private Instant updatedAt;
    private Instant completedAt;
}
