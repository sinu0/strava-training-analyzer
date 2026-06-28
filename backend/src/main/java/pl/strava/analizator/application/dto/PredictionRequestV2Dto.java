package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequestV2Dto {

    private String predictionType;
    private String persona;
    private String modelId;
    private Integer maxToolCalls;
}
