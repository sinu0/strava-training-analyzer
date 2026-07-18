package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.strava.analizator.domain.model.ProcessingJob;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingJobDto {

    private UUID id;
    private String jobType;
    private String mode;
    private String stage;
    private String status;
    private int attempt;
    private String errorMessage;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
    private Instant updatedAt;

    public static ProcessingJobDto from(ProcessingJob job) {
        return ProcessingJobDto.builder()
                .id(job.getId())
                .jobType(job.getJobType())
                .mode(job.getMode())
                .stage(job.getStage())
                .status(job.getStatus())
                .attempt(job.getAttempt())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
