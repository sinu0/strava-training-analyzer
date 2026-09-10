package pl.strava.analizator.application.ai.knowledge;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.EmbeddingPort;
import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexEntry;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;

@Component
public class SportsScienceIndexer {

    private static final Logger log = LoggerFactory.getLogger(SportsScienceIndexer.class);
    private static final int EMBEDDING_DIMENSIONS = 384;

    private final Optional<EmbeddingPort> embeddingPort;
    private final ContentChunker chunker;
    private final int chunkSize;

    public SportsScienceIndexer(Optional<EmbeddingPort> embeddingPort,
                                ContentChunker chunker,
                                @org.springframework.beans.factory.annotation.Value("${ai.knowledge.chunk-size:800}") int chunkSize) {
        this.embeddingPort = embeddingPort;
        this.chunker = chunker;
        if (chunkSize <= 50) {
            throw new IllegalArgumentException("ai.knowledge.chunk-size musi być większe niż 50");
        }
        this.chunkSize = chunkSize;
    }

    public List<KnowledgeIndexEntry> prepareContent(KnowledgeSource source, KnowledgeType type,
                                                     String url, String title, String content,
                                                     String contentHash, String corpusVersion) {
        EmbeddingPort embeddings = embeddingPort.orElseThrow(() -> new IllegalStateException("Brak skonfigurowanego dostawcy embeddingów"));
        List<String> topics = chunker.extractTopics(content);
        List<String> chunks = chunker.chunk(content, chunkSize, Math.min(100, chunkSize / 4));
        if (chunks.isEmpty()) {
            throw new IllegalStateException("Źródło nie zawiera treści wystarczającej do indeksowania: " + url);
        }
        List<KnowledgeIndexEntry> entries = new ArrayList<>();

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            float[] embedding = embeddings.embed(chunk);
            if (embedding == null || embedding.length != EMBEDDING_DIMENSIONS) {
                int actualDimensions = embedding == null ? 0 : embedding.length;
                throw new IllegalStateException("Embedding dla " + url + " ma " + actualDimensions
                        + " wymiarów zamiast " + EMBEDDING_DIMENSIONS);
            }
            KnowledgeDocument doc = KnowledgeDocument.builder()
                    .source(source)
                    .url(url)
                    .title(title)
                    .type(type)
                    .topics(topics)
                    .content(chunk)
                    .chunkIndex(i)
                    .contentHash(contentHash)
                    .corpusVersion(corpusVersion)
                    .embeddedAt(now)
                    .refreshedAt(now)
                    .build();
            entries.add(new KnowledgeIndexEntry(doc, embedding));
        }

        log.info("Prepared {} chunks from '{}' ({})", entries.size(), title, source);
        return List.copyOf(entries);
    }
}
