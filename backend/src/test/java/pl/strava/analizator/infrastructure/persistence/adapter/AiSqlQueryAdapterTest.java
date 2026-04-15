package pl.strava.analizator.infrastructure.persistence.adapter;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class AiSqlQueryAdapterTest {

    private final AiSqlQueryAdapter adapter = new AiSqlQueryAdapter(new NoOpDataSource(), new ObjectMapper());

    @Test
    void executeReadOnlySql_rejectsNonSelectStatements() {
        assertThatThrownBy(() -> adapter.executeReadOnlySql("delete from activities", 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only SELECT/CTE");
    }

    @Test
    void executeReadOnlySql_rejectsMultipleStatements() {
        assertThatThrownBy(() -> adapter.executeReadOnlySql("select * from activities; select 1", 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("single SQL statement");
    }

    @Test
    void executeReadOnlySql_rejectsSystemSchemas() {
        assertThatThrownBy(() -> adapter.executeReadOnlySql("select * from pg_catalog.pg_tables", 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("System schemas");
    }

    private static final class NoOpDataSource implements DataSource {
        @Override public java.sql.Connection getConnection() { throw new UnsupportedOperationException(); }
        @Override public java.sql.Connection getConnection(String username, String password) { throw new UnsupportedOperationException(); }
        @Override public <T> T unwrap(Class<T> iface) { throw new UnsupportedOperationException(); }
        @Override public boolean isWrapperFor(Class<?> iface) { return false; }
        @Override public java.io.PrintWriter getLogWriter() { throw new UnsupportedOperationException(); }
        @Override public void setLogWriter(java.io.PrintWriter out) { throw new UnsupportedOperationException(); }
        @Override public void setLoginTimeout(int seconds) { throw new UnsupportedOperationException(); }
        @Override public int getLoginTimeout() { return 0; }
        @Override public java.util.logging.Logger getParentLogger() { throw new UnsupportedOperationException(); }
    }
}
