package pl.strava.analizator.domain.port;

/**
 * Read-only SQL access used by the AI analysis module.
 */
public interface AiSqlQueryPort {

    String describeSchema();

    String executeReadOnlySql(String sql, int maxRows);
}
