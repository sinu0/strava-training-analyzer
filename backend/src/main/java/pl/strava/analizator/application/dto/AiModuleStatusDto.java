package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModuleStatusDto {

    private boolean enabled;
    private boolean batchEnabled;
    private String batchCron;
    private boolean todayTipsReady;
    private String activeProvider;
    private String activeModel;
    private boolean modelAvailable;
    private List<String> availableProviders;
    private List<String> availablePredictionTypes;
}
