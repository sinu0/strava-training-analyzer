package pl.strava.analizator.infrastructure.persistence.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class KnowledgeIndexAdapterTest {

    @Mock private JdbcTemplate jdbc;

    @Test
    void emptyExistingIndexIsAvailable() {
        when(jdbc.queryForObject("SELECT count(*) FROM ai_knowledge_documents", Long.class))
                .thenReturn(0L);
        KnowledgeIndexAdapter adapter = new KnowledgeIndexAdapter(jdbc);

        assertThat(adapter.isAvailable()).isTrue();
        verify(jdbc).queryForObject("SELECT count(*) FROM ai_knowledge_documents", Long.class);
    }

    @Test
    void missingIndexIsUnavailable() {
        when(jdbc.queryForObject("SELECT count(*) FROM ai_knowledge_documents", Long.class))
                .thenThrow(new IllegalStateException("missing table"));

        assertThat(new KnowledgeIndexAdapter(jdbc).isAvailable()).isFalse();
    }

    @Test
    void currentCorpusVersionReadsOnlyACompleteSingleVersion() {
        when(jdbc.queryForObject(
                "SELECT min(corpus_version) FROM ai_knowledge_documents "
                        + "HAVING count(*) > 0 AND count(DISTINCT corpus_version) = 1 "
                        + "AND count(corpus_version) = count(*)",
                String.class))
                .thenReturn("version-1");

        assertThat(new KnowledgeIndexAdapter(jdbc).currentCorpusVersion())
                .isEqualTo(Optional.of("version-1"));
    }

    @Test
    void replaceAllRejectsEmptyCorpusBeforeDelete() {
        KnowledgeIndexAdapter adapter = new KnowledgeIndexAdapter(jdbc);

        assertThatThrownBy(() -> adapter.replaceAll(List.of()))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(jdbc);
    }

    @Test
    void currentCorpusVersionIsEmptyForEmptyOrMixedCorpus() {
        when(jdbc.queryForObject(
                "SELECT min(corpus_version) FROM ai_knowledge_documents "
                        + "HAVING count(*) > 0 AND count(DISTINCT corpus_version) = 1 "
                        + "AND count(corpus_version) = count(*)",
                String.class))
                .thenThrow(new EmptyResultDataAccessException(1));

        assertThat(new KnowledgeIndexAdapter(jdbc).currentCorpusVersion()).isEmpty();
    }
}
