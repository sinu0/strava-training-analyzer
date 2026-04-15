package pl.strava.analizator.application.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequestDto {

    private String predictionType;
    private String modelId;
    private Map<String, String> extraParameters;
}
