package pl.strava.analizator.application.ai.knowledge;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.KnowledgeIndexEntry;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;

@Component
public class KnowledgeBaseBuilder {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseBuilder.class);

    private final ContentFetcher contentFetcher;
    private final ContentChunker contentChunker;
    private final SportsScienceIndexer indexer;
    private final KnowledgeIndexPort knowledgeIndex;
    private final int maxDocuments;
    private final List<KnowledgeSourceConfig> sources;

    public KnowledgeBaseBuilder(ContentFetcher contentFetcher,
                                 ContentChunker contentChunker,
                                 SportsScienceIndexer indexer,
                                 KnowledgeIndexPort knowledgeIndex,
                                 @Value("${ai.knowledge.max-documents:1000}") int maxDocuments) {
        this.contentFetcher = contentFetcher;
        this.contentChunker = contentChunker;
        this.indexer = indexer;
        this.knowledgeIndex = knowledgeIndex;
        if (maxDocuments <= 0) {
            throw new IllegalArgumentException("ai.knowledge.max-documents musi być większe od zera");
        }
        this.maxDocuments = maxDocuments;
        this.sources = List.of(KnowledgeSourceConfig.forTrainingPeaks(), KnowledgeSourceConfig.forCoggan());
    }

    public synchronized KnowledgeBuildResult rebuild() {
        log.info("Starting knowledge base rebuild...");
        List<FetchedSource> fetchedSources = fetchCompleteSnapshot();
        String corpusVersion = corpusVersion(fetchedSources);

        if (knowledgeIndex.currentCorpusVersion().filter(corpusVersion::equals).isPresent()) {
            int currentDocuments = Math.toIntExact(knowledgeIndex.count());
            log.info("Knowledge corpus {} is unchanged ({} documents)", corpusVersion, currentDocuments);
            return new KnowledgeBuildResult(false, corpusVersion, currentDocuments, fetchedSources.size());
        }

        List<KnowledgeIndexEntry> entries = new ArrayList<>();
        for (FetchedSource source : fetchedSources) {
            entries.addAll(indexer.prepareContent(
                    source.config().source(),
                    source.config().defaultType(),
                    source.url(),
                    source.url(),
                    source.content(),
                    source.contentHash(),
                    corpusVersion));
            if (entries.size() > maxDocuments) {
                throw new IllegalStateException("Korpus przekracza limit " + maxDocuments + " dokumentów");
            }
        }
        if (entries.isEmpty()) {
            throw new IllegalStateException("Nie przygotowano żadnych dokumentów; poprzedni korpus pozostaje aktywny");
        }

        knowledgeIndex.replaceAll(List.copyOf(entries));
        log.info("Knowledge base rebuild complete. Corpus: {}, documents: {}", corpusVersion, entries.size());
        return new KnowledgeBuildResult(true, corpusVersion, entries.size(), fetchedSources.size());
    }

    private List<FetchedSource> fetchCompleteSnapshot() {
        List<FetchedSource> fetched = new ArrayList<>();
        for (KnowledgeSourceConfig config : sources) {
            if (!config.enabled()) {
                continue;
            }
            for (String url : config.seedUrls()) {
                log.info("Fetching knowledge source: {} ({})", config.name(), url);
                String html = contentFetcher.fetch(url);
                if (html == null) {
                    throw new IllegalStateException("Nie udało się pobrać źródła wiedzy: " + url);
                }
                String cleanText = contentChunker.extractMainContent(html);
                if (cleanText.length() <= 50) {
                    throw new IllegalStateException("Źródło wiedzy nie zawiera wystarczającej treści: " + url);
                }
                fetched.add(new FetchedSource(config, url, cleanText, sha256(cleanText)));
            }
        }
        if (fetched.isEmpty()) {
            throw new IllegalStateException("Nie skonfigurowano żadnych aktywnych źródeł wiedzy");
        }
        return List.copyOf(fetched);
    }

    private String corpusVersion(List<FetchedSource> fetchedSources) {
        String manifest = fetchedSources.stream()
                .sorted(java.util.Comparator.comparing(FetchedSource::url))
                .map(source -> String.join("|",
                        "knowledge-corpus-v1",
                        source.config().source().name(),
                        source.config().defaultType().name(),
                        source.url(),
                        source.contentHash()))
                .collect(Collectors.joining("\n"));
        return sha256(manifest);
    }

    private String sha256(String value) {
        Objects.requireNonNull(value, "value");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private record FetchedSource(
            KnowledgeSourceConfig config,
            String url,
            String content,
            String contentHash
    ) {
    }
}
