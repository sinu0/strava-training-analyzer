CREATE TABLE app_config (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key   VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    encrypted    BOOLEAN NOT NULL DEFAULT false,
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
