package pl.strava.analizator.application.ai.knowledge;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.EmbeddingPort;
import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;

@Component
public class SportsScienceIndexer {

    private static final Logger log = LoggerFactory.getLogger(SportsScienceIndexer.class);

    private final KnowledgeIndexPort knowledgeIndexPort;
    private final EmbeddingPort embeddingPort;

    public SportsScienceIndexer(KnowledgeIndexPort knowledgeIndexPort,
                                EmbeddingPort embeddingPort) {
        this.knowledgeIndexPort = knowledgeIndexPort;
        this.embeddingPort = embeddingPort;
    }

    public List<KnowledgeDocument> indexContent(KnowledgeSource source, KnowledgeType type,
                                                 String url, String title, String content) {
        ContentChunker chunker = new ContentChunker();
        List<String> topics = chunker.extractTopics(content);
        List<String> chunks = chunker.chunk(content);
        List<KnowledgeDocument> docs = new java.util.ArrayList<>();

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        for (int i = 0; i < chunks.size(); i++) {
            try {
                String chunk = chunks.get(i);
                float[] embedding = embeddingPort.embed(chunk);
                KnowledgeDocument doc = KnowledgeDocument.builder()
                        .source(source)
                        .url(url)
                        .title(title)
                        .type(type)
                        .topics(topics)
                        .content(chunk)
                        .chunkIndex(i)
                        .embeddedAt(now)
                        .refreshedAt(now)
                        .build();
                knowledgeIndexPort.store(doc, embedding);
                docs.add(doc);
            } catch (Exception e) {
                log.warn("Failed to index chunk {} of {}: {}", i, title, e.getMessage());
            }
        }

        log.info("Indexed {} chunks from '{}' ({})", chunks.size(), title, source);
        return docs;
    }
}
