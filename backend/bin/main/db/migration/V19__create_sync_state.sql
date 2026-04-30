CREATE TABLE sync_state (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'idle',
    last_sync_at TIMESTAMPTZ,
    imported_total INT NOT NULL DEFAULT 0,
    skipped_total INT NOT NULL DEFAULT 0,
    rate_limit_resets_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO sync_state (status) VALUES ('idle');
