package pl.strava.analizator.application.ai.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.ai.EmbeddingPort;
import pl.strava.analizator.domain.ai.KnowledgeIndexEntry;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;

class SportsScienceIndexerTest {

    @Test
    void prepareContentBuildsCompleteVersionedEntriesWithoutPersisting() {
        EmbeddingPort embeddings = mock(EmbeddingPort.class);
        when(embeddings.embed(anyString())).thenReturn(new float[384]);
        SportsScienceIndexer indexer = new SportsScienceIndexer(
                Optional.of(embeddings), new ContentChunker(), 800);

        List<KnowledgeIndexEntry> entries = indexer.prepareContent(
                KnowledgeSource.COGGAN,
                KnowledgeType.FRAMEWORK,
                "https://example.test/power-zones",
                "Power zones",
                "Cycling power and FTP training zones provide a repeatable framework for threshold training and recovery.",
                "content-hash",
                "corpus-version");

        assertThat(entries).hasSize(1);
        assertThat(entries.getFirst().document().getContentHash()).isEqualTo("content-hash");
        assertThat(entries.getFirst().document().getCorpusVersion()).isEqualTo("corpus-version");
        assertThat(entries.getFirst().embedding()).hasSize(384);
    }

    @Test
    void prepareContentRejectsVectorWithWrongDimension() {
        EmbeddingPort embeddings = mock(EmbeddingPort.class);
        when(embeddings.embed(anyString())).thenReturn(new float[2]);
        SportsScienceIndexer indexer = new SportsScienceIndexer(
                Optional.of(embeddings), new ContentChunker(), 800);

        assertThatThrownBy(() -> indexer.prepareContent(
                KnowledgeSource.CUSTOM,
                KnowledgeType.SCIENTIFIC,
                "https://example.test/source",
                "Source",
                "A sufficiently long scientific training paragraph that can be transformed into one embedding vector.",
                "hash",
                "version"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("384");
    }

    @Test
    void prepareContentFailsWhenEmbeddingProviderIsMissing() {
        SportsScienceIndexer indexer = new SportsScienceIndexer(
                Optional.empty(), new ContentChunker(), 800);

        assertThatThrownBy(() -> indexer.prepareContent(
                KnowledgeSource.CUSTOM,
                KnowledgeType.SCIENTIFIC,
                "https://example.test/source",
                "Source",
                "A sufficiently long scientific training paragraph that requires a configured embedding provider.",
                "hash",
                "version"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("embedding");
    }

    @Test
    void constructorRejectsChunkSizeThatCannotProduceUsefulDocuments() {
        assertThatThrownBy(() -> new SportsScienceIndexer(
                Optional.empty(), new ContentChunker(), 50))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chunk-size");
    }
}
