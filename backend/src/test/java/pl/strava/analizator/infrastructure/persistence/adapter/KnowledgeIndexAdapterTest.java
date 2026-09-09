package pl.strava.analizator.infrastructure.persistence.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
}
