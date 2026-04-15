package pl.strava.analizator.application.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BatchRunResultDto {
    int success;
    int skipped;
    int failed;
    String message;
}
