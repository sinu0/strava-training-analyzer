package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiValidationReportDto {

    private String status;
    private int validSamples;
    private int rejectedSamples;
    private int minimumSamples;
    private Double meanAccuracy;
    private Double meanConfidence;
    private Double calibrationGap;
    private Map<String, Integer> samplesByType;
    private String provenance;
    private Instant generatedAt;
}
