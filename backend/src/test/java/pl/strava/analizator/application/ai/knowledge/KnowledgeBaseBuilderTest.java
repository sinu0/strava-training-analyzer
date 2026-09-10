package pl.strava.analizator.application.ai.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexEntry;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;

class KnowledgeBaseBuilderTest {

    private static final String URL_ONE =
            "https://www.trainingpeaks.com/learn/articles/what-is-the-performance-management-chart/";
    private static final String URL_TWO =
            "https://www.trainingpeaks.com/blog/managing-your-training-stress-balance/";
    private static final String URL_THREE =
            "https://www.trainingpeaks.com/blog/power-training-levels/";

    private final ContentFetcher fetcher = mock(ContentFetcher.class);
    private final SportsScienceIndexer indexer = mock(SportsScienceIndexer.class);
    private final KnowledgeIndexPort index = mock(KnowledgeIndexPort.class);
    private KnowledgeBaseBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new KnowledgeBaseBuilder(
                fetcher, new ContentChunker(), indexer, index, 10);
    }

    @Test
    void rebuildPreparesEverySourceBeforeAtomicReplacement() {
        stubFetchedSources();
        when(index.currentCorpusVersion()).thenReturn(Optional.empty());
        when(indexer.prepareContent(any(), any(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenAnswer(invocation -> List.of(entry(
                        invocation.getArgument(2),
                        invocation.getArgument(5),
                        invocation.getArgument(6))));

        KnowledgeBuildResult result = builder.rebuild();

        assertThat(result.changed()).isTrue();
        assertThat(result.documents()).isEqualTo(3);
        assertThat(result.sources()).isEqualTo(3);
        assertThat(result.corpusVersion()).hasSize(64);
        verify(index).replaceAll(any());
    }

    @Test
    void rebuildDoesNotTouchCurrentCorpusWhenOneSourceCannotBeFetched() {
        when(fetcher.fetch(URL_ONE)).thenReturn(html("first"));
        when(fetcher.fetch(URL_TWO)).thenReturn(null);

        assertThatThrownBy(() -> builder.rebuild())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(URL_TWO);

        verifyNoInteractions(indexer);
        verify(index, never()).replaceAll(any());
    }

    @Test
    void rebuildIsIdempotentWhenVersionHasNotChanged() {
        stubFetchedSources();
        when(index.currentCorpusVersion()).thenReturn(Optional.empty());
        when(indexer.prepareContent(any(), any(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenAnswer(invocation -> List.of(entry(
                        invocation.getArgument(2),
                        invocation.getArgument(5),
                        invocation.getArgument(6))));
        KnowledgeBuildResult first = builder.rebuild();

        clearInvocations(indexer, index);
        when(index.currentCorpusVersion()).thenReturn(Optional.of(first.corpusVersion()));
        when(index.count()).thenReturn(3L);
        KnowledgeBuildResult second = builder.rebuild();

        assertThat(second.changed()).isFalse();
        assertThat(second.documents()).isEqualTo(3);
        verifyNoInteractions(indexer);
        verify(index, never()).replaceAll(any());
    }

    @Test
    void rebuildPreservesCurrentCorpusWhenEmbeddingPreparationFails() {
        stubFetchedSources();
        when(index.currentCorpusVersion()).thenReturn(Optional.empty());
        when(indexer.prepareContent(any(), any(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new IllegalStateException("embedding failed"));

        assertThatThrownBy(() -> builder.rebuild())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("embedding failed");

        verify(index, never()).replaceAll(any());
    }

    private void stubFetchedSources() {
        when(fetcher.fetch(URL_ONE)).thenReturn(html("first"));
        when(fetcher.fetch(URL_TWO)).thenReturn(html("second"));
        when(fetcher.fetch(URL_THREE)).thenReturn(html("third"));
    }

    private String html(String marker) {
        return "<html><main>" + marker
                + " verified cycling training content with enough detail to create a trustworthy knowledge document."
                + "</main></html>";
    }

    private KnowledgeIndexEntry entry(String url, String contentHash, String corpusVersion) {
        return new KnowledgeIndexEntry(
                KnowledgeDocument.builder()
                        .source(KnowledgeSource.CUSTOM)
                        .url(url)
                        .title(url)
                        .type(KnowledgeType.SCIENTIFIC)
                        .topics(List.of("training"))
                        .content("Verified source content long enough to be indexed as a document.")
                        .chunkIndex(0)
                        .contentHash(contentHash)
                        .corpusVersion(corpusVersion)
                        .build(),
                new float[384]);
    }
}
