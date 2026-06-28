package pl.strava.analizator.infrastructure.persistence.adapter;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;
import pl.strava.analizator.domain.ai.KnowledgeSource;
import pl.strava.analizator.domain.ai.KnowledgeType;

@Component
public class KnowledgeIndexAdapter implements KnowledgeIndexPort {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeIndexAdapter.class);

    private final JdbcTemplate jdbc;

    public KnowledgeIndexAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void store(KnowledgeDocument doc, float[] embedding) {
        String embeddingStr = Arrays.toString(embedding)
                .replace("[", "[").replace("]", "]");
        jdbc.update(
                "INSERT INTO ai_knowledge_documents (source, url, title, doc_type, topics, content, chunk_index, embedding, embedded_at, refreshed_at) "
                        + "VALUES (?::varchar, ?::text, ?::varchar, ?::varchar, ?::text[], ?::text, ?::int, ?::vector, ?::timestamptz, ?::timestamptz)",
                doc.getSource().name(),
                doc.getUrl(),
                doc.getTitle(),
                doc.getType().name(),
                doc.getTopics().toArray(new String[0]),
                doc.getContent(),
                doc.getChunkIndex(),
                embeddingStr,
                Timestamp.from(doc.getEmbeddedAt() != null ? doc.getEmbeddedAt().toInstant() : OffsetDateTime.now(ZoneOffset.UTC).toInstant()),
                Timestamp.from(doc.getRefreshedAt() != null ? doc.getRefreshedAt().toInstant() : OffsetDateTime.now(ZoneOffset.UTC).toInstant())
        );
    }

    @Override
    public List<KnowledgeDocument> findSimilar(float[] queryEmbedding, int topK, KnowledgeType typeFilter) {
        String embeddingStr = Arrays.toString(queryEmbedding);
        String sql = "SELECT id, source, url, title, doc_type, topics, content, chunk_index, embedded_at, refreshed_at "
                + "FROM ai_knowledge_documents "
                + "WHERE embedding IS NOT NULL ";
        if (typeFilter != null) {
            sql += "AND doc_type = ? ";
        }
        sql += "ORDER BY embedding <=> ?::vector LIMIT ?";

        Object[] params;
        if (typeFilter != null) {
            params = new Object[]{typeFilter.name(), embeddingStr, topK};
        } else {
            params = new Object[]{embeddingStr, topK};
        }

        return jdbc.query(sql, this::mapRow, params);
    }

    @Override
    public long count() {
        Long result = jdbc.queryForObject("SELECT count(*) FROM ai_knowledge_documents", Long.class);
        return result != null ? result : 0;
    }

    @Override
    public void clear() {
        jdbc.update("DELETE FROM ai_knowledge_documents");
    }

    @Override
    public boolean isAvailable() {
        try {
            jdbc.queryForObject("SELECT 1 FROM ai_knowledge_documents LIMIT 0", Integer.class);
            return true;
        } catch (Exception e) {
            log.debug("Knowledge index not available: {}", e.getMessage());
            return false;
        }
    }

    private KnowledgeDocument mapRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp embeddedTs = rs.getTimestamp("embedded_at");
        Timestamp refreshedTs = rs.getTimestamp("refreshed_at");

        String[] topicsArr = (String[]) rs.getArray("topics").getArray();
        List<String> topics = topicsArr != null ? Arrays.asList(topicsArr) : List.of();

        return KnowledgeDocument.builder()
                .id(rs.getString("id"))
                .source(KnowledgeSource.valueOf(rs.getString("source")))
                .url(rs.getString("url"))
                .title(rs.getString("title"))
                .type(KnowledgeType.valueOf(rs.getString("doc_type")))
                .topics(topics)
                .content(rs.getString("content"))
                .chunkIndex(rs.getInt("chunk_index"))
                .embeddedAt(embeddedTs != null ? embeddedTs.toInstant().atOffset(ZoneOffset.UTC) : null)
                .refreshedAt(refreshedTs != null ? refreshedTs.toInstant().atOffset(ZoneOffset.UTC) : null)
                .build();
    }
}
