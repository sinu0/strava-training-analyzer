package pl.strava.analizator.application.ai.knowledge;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.KnowledgeType;

@Component
public class KnowledgeBaseBuilder {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseBuilder.class);

    private final ContentFetcher contentFetcher;
    private final ContentChunker contentChunker;
    private final SportsScienceIndexer indexer;

    public KnowledgeBaseBuilder(ContentFetcher contentFetcher,
                                 ContentChunker contentChunker,
                                 SportsScienceIndexer indexer) {
        this.contentFetcher = contentFetcher;
        this.contentChunker = contentChunker;
        this.indexer = indexer;
    }

    public int rebuild() {
        log.info("Starting knowledge base rebuild...");
        int totalDocs = 0;

        for (KnowledgeSourceConfig config : enabledSources()) {
            try {
                log.info("Processing source: {}", config.name());
                for (String url : config.seedUrls()) {
                    try {
                        String html = contentFetcher.fetch(url);
                        if (html == null) continue;

                        String cleanText = contentChunker.extractMainContent(html);
                        KnowledgeType type = KnowledgeType.valueOf(config.defaultType());

                        var docs = indexer.indexContent(
                                mapToSource(config.name()),
                                type,
                                url,
                                url,
                                cleanText
                        );
                        totalDocs += docs.size();
                    } catch (Exception e) {
                        log.warn("Failed to process url {}: {}", url, e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to process source {}: {}", config.name(), e.getMessage());
            }
        }

        log.info("Knowledge base rebuild complete. Total documents: {}", totalDocs);
        return totalDocs;
    }

    private List<KnowledgeSourceConfig> enabledSources() {
        return List.of(
                KnowledgeSourceConfig.forTrainingPeaks(),
                KnowledgeSourceConfig.forFriel(),
                KnowledgeSourceConfig.forCoggan()
        );
    }

    private pl.strava.analizator.domain.ai.KnowledgeSource mapToSource(String name) {
        return switch (name) {
            case "trainingpeaks" -> pl.strava.analizator.domain.ai.KnowledgeSource.TRAININGPEAKS;
            case "friel" -> pl.strava.analizator.domain.ai.KnowledgeSource.FRIEL;
            case "coggan" -> pl.strava.analizator.domain.ai.KnowledgeSource.COGGAN;
            default -> pl.strava.analizator.domain.ai.KnowledgeSource.CUSTOM;
        };
    }
}
