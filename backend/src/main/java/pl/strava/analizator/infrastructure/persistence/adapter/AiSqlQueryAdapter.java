package pl.strava.analizator.infrastructure.persistence.adapter;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.port.AiSqlQueryPort;

@Component
@RequiredArgsConstructor
public class AiSqlQueryAdapter implements AiSqlQueryPort {

    private static final int DEFAULT_MAX_ROWS = 50;
    private static final int ABSOLUTE_MAX_ROWS = 100;
    private static final int QUERY_TIMEOUT_SECONDS = 5;
    private static final Pattern FORBIDDEN_SQL = Pattern.compile(
            "\\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|comment|copy|call|do|execute|merge|refresh|vacuum|analyze|cluster|reindex)\\b");
    private static final Pattern FORBIDDEN_SCHEMAS = Pattern.compile(
            "\\b(information_schema|pg_catalog|pg_toast|pg_temp)\\b");

    private final DataSource dataSource;
    private final ObjectMapper objectMapper;

    @Override
    public String describeSchema() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            List<TableSchema> tables = new ArrayList<>();

            try (ResultSet tableRs = metaData.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"})) {
                while (tableRs.next()) {
                    String schema = tableRs.getString("TABLE_SCHEM");
                    String tableName = tableRs.getString("TABLE_NAME");
                    if (!isApplicationTable(schema, tableName)) {
                        continue;
                    }
                    tables.add(new TableSchema(schema, tableName, readColumns(metaData, schema, tableName), readPrimaryKeys(metaData, schema, tableName)));
                }
            }

            tables.sort(Comparator.comparing(TableSchema::schema).thenComparing(TableSchema::table));
            StringBuilder sb = new StringBuilder("Database schema (application tables):\n");
            for (TableSchema table : tables) {
                sb.append("- ").append(table.schema()).append('.').append(table.table()).append(": ");
                sb.append(table.columns().stream()
                        .map(column -> formatColumn(column, table.primaryKeys()))
                        .reduce((a, b) -> a + ", " + b)
                        .orElse("no columns"));
                sb.append('\n');
            }
            return sb.toString().trim();
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to describe database schema: " + e.getMessage(), e);
        }
    }

    @Override
    public String executeReadOnlySql(String sql, int maxRows) {
        validateReadOnlySql(sql);
        int rowLimit = normalizeRowLimit(maxRows);

        try (Connection connection = dataSource.getConnection()) {
            connection.setReadOnly(true);
            try (Statement statement = connection.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)) {
                statement.setMaxRows(rowLimit);
                statement.setQueryTimeout(QUERY_TIMEOUT_SECONDS);
                boolean hasResultSet = statement.execute(sql);
                if (!hasResultSet) {
                    throw new IllegalArgumentException("SQL must return rows.");
                }
                try (ResultSet resultSet = statement.getResultSet()) {
                    return serializeQueryResult(resultSet, rowLimit);
                }
            }
        } catch (SQLException e) {
            throw new IllegalStateException("SQL query failed: " + e.getMessage(), e);
        }
    }

    private void validateReadOnlySql(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new IllegalArgumentException("SQL query must not be blank.");
        }
        String normalized = sql.trim().toLowerCase(Locale.ROOT);
        if (!(normalized.startsWith("select") || normalized.startsWith("with"))) {
            throw new IllegalArgumentException("Only SELECT/CTE read-only queries are allowed.");
        }
        if (normalized.contains(";")) {
            throw new IllegalArgumentException("Only a single SQL statement is allowed.");
        }
        if (normalized.contains("--") || normalized.contains("/*") || normalized.contains("*/")) {
            throw new IllegalArgumentException("SQL comments are not allowed.");
        }
        if (FORBIDDEN_SQL.matcher(normalized).find()) {
            throw new IllegalArgumentException("Only read-only SQL is allowed.");
        }
        if (FORBIDDEN_SCHEMAS.matcher(normalized).find()) {
            throw new IllegalArgumentException("System schemas are not available to AI queries.");
        }
    }

    private String serializeQueryResult(ResultSet resultSet, int rowLimit) throws SQLException {
        ResultSetMetaData metaData = resultSet.getMetaData();
        int columnCount = metaData.getColumnCount();
        List<String> columns = new ArrayList<>(columnCount);
        for (int i = 1; i <= columnCount; i++) {
            columns.add(metaData.getColumnLabel(i));
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        while (resultSet.next()) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 1; i <= columnCount; i++) {
                row.put(columns.get(i - 1), normalizeCell(resultSet.getObject(i)));
            }
            rows.add(row);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("rowLimit", rowLimit);
        payload.put("columns", columns);
        payload.put("rows", rows);
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize SQL query result: " + e.getMessage(), e);
        }
    }

    private Object normalizeCell(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID uuid) {
            return uuid.toString();
        }
        if (value instanceof TemporalAccessor) {
            return value.toString();
        }
        if (value instanceof byte[]) {
            return "<binary>";
        }
        return value;
    }

    private int normalizeRowLimit(int maxRows) {
        if (maxRows <= 0) {
            return DEFAULT_MAX_ROWS;
        }
        return Math.min(maxRows, ABSOLUTE_MAX_ROWS);
    }

    private boolean isApplicationTable(String schema, String tableName) {
        if (tableName == null || tableName.isBlank()) {
            return false;
        }
        if ("flyway_schema_history".equalsIgnoreCase(tableName)) {
            return false;
        }
        return schema == null
                || schema.isBlank()
                || "public".equalsIgnoreCase(schema);
    }

    private List<ColumnSchema> readColumns(DatabaseMetaData metaData, String schema, String tableName) throws SQLException {
        List<ColumnSchema> columns = new ArrayList<>();
        try (ResultSet columnRs = metaData.getColumns(null, schema, tableName, "%")) {
            while (columnRs.next()) {
                columns.add(new ColumnSchema(
                        columnRs.getString("COLUMN_NAME"),
                        columnRs.getString("TYPE_NAME")));
            }
        }
        return columns;
    }

    private List<String> readPrimaryKeys(DatabaseMetaData metaData, String schema, String tableName) throws SQLException {
        List<String> primaryKeys = new ArrayList<>();
        try (ResultSet pkRs = metaData.getPrimaryKeys(null, schema, tableName)) {
            while (pkRs.next()) {
                primaryKeys.add(pkRs.getString("COLUMN_NAME"));
            }
        }
        return primaryKeys;
    }

    private String formatColumn(ColumnSchema column, List<String> primaryKeys) {
        String suffix = primaryKeys.contains(column.name()) ? " [pk]" : "";
        return column.name() + " " + column.type() + suffix;
    }

    private record TableSchema(String schema, String table, List<ColumnSchema> columns, List<String> primaryKeys) {}

    private record ColumnSchema(String name, String type) {}
}
