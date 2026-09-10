-- Rebuild application indexes before accepting the libc collation version of the Bookworm image.
-- REINDEX DATABASE cannot run safely through Flyway because it conflicts with the migrator's
-- own metadata transaction, so each public-schema index is rebuilt explicitly.

DO $migration$
DECLARE
    index_to_rebuild record;
BEGIN
    FOR index_to_rebuild IN
        SELECT schemaname, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename <> 'flyway_schema_history'
        ORDER BY indexname
    LOOP
        EXECUTE format(
            'REINDEX INDEX %I.%I',
            index_to_rebuild.schemaname,
            index_to_rebuild.indexname
        );
    END LOOP;
END
$migration$;

ALTER DATABASE "${flyway:database}" REFRESH COLLATION VERSION;
