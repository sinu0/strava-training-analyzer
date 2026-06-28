package pl.strava.analizator.application.ai.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.ai.EmbeddingPort;
import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;
import pl.strava.analizator.domain.ai.PredictionType;

@ExtendWith(MockitoExtension.class)
class RagServiceV2Test {

    @Mock private EmbeddingPort embeddingPort;
    @Mock private KnowledgeIndexPort knowledgeIndexPort;

    private RagServiceV2 ragService;

    @BeforeEach
    void setUp() {
        ragService = new RagServiceV2(embeddingPort, knowledgeIndexPort);
    }

    @Test
    void retrieveAndFormat_indexNotAvailable_returnsEmpty() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(false);
        String result = ragService.retrieveAndFormat(PredictionType.FTP_PREDICTION, "query", 5);
        assertThat(result).isEmpty();
    }

    @Test
    void retrieveAndFormat_indexEmpty_returnsEmpty() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(true);
        when(knowledgeIndexPort.count()).thenReturn(0L);
        String result = ragService.retrieveAndFormat(PredictionType.FTP_PREDICTION, "query", 5);
        assertThat(result).isEmpty();
    }

    @Test
    void retrieveAndFormat_findsDocuments_returnsFormattedText() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(true);
        when(knowledgeIndexPort.count()).thenReturn(10L);
        when(embeddingPort.embed("query")).thenReturn(new float[384]);

        KnowledgeDocument doc = KnowledgeDocument.builder()
                .source(KnowledgeSource.COGGAN)
                .title("Power Training Levels")
                .type(KnowledgeType.FRAMEWORK)
                .topics(List.of("power", "ftp"))
                .content("Coggan defines 7 power training levels from Recovery to Neuromuscular Power.")
                .chunkIndex(0)
                .build();
        when(knowledgeIndexPort.findSimilar(any(), eq(5), eq(null)))
                .thenReturn(List.of(doc));

        String result = ragService.retrieveAndFormat(PredictionType.FTP_PREDICTION, "query", 5);

        assertThat(result).contains("RELEVANT TRAINING KNOWLEDGE");
        assertThat(result).contains("[FRAMEWORK]");
        assertThat(result).contains("Coggan defines 7 power training levels");
    }

    @Test
    void retrieveAndFormat_embeddingFails_returnsEmpty() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(true);
        when(knowledgeIndexPort.count()).thenReturn(10L);
        when(embeddingPort.embed(any())).thenThrow(new RuntimeException("model offline"));

        String result = ragService.retrieveAndFormat(PredictionType.FTP_PREDICTION, "query", 5);
        assertThat(result).isEmpty();
    }

    @Test
    void isAvailable_bothReady_returnsTrue() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(true);
        when(knowledgeIndexPort.count()).thenReturn(5L);
        assertThat(ragService.isAvailable()).isTrue();
    }

    @Test
    void isAvailable_indexDown_returnsFalse() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(false);
        assertThat(ragService.isAvailable()).isFalse();
    }

    @Test
    void retrieveAndFormat_noResults_returnsEmpty() {
        when(knowledgeIndexPort.isAvailable()).thenReturn(true);
        when(knowledgeIndexPort.count()).thenReturn(10L);
        when(embeddingPort.embed("query")).thenReturn(new float[384]);
        when(knowledgeIndexPort.findSimilar(any(), anyInt(), eq(null))).thenReturn(List.of());

        String result = ragService.retrieveAndFormat(PredictionType.FTP_PREDICTION, "query", 5);
        assertThat(result).isEmpty();
    }
}
