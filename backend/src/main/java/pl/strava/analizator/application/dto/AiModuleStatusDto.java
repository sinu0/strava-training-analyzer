package pl.strava.analizator.application.dto;

import java.time.Instant;
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
    private String providerStatus;
    private String knowledgeStatus;
    private long knowledgeDocuments;
    private String knowledgeCorpusVersion;
    private String noteQueueStatus;
    private Instant noteQueueSuspendedUntil;
    private List<String> availableProviders;
    private List<String> availablePredictionTypes;
}
