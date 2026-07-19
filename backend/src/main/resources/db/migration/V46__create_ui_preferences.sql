CREATE TABLE ui_preferences (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL,
    revision BIGINT NOT NULL,
    dashboard_json JSONB NOT NULL,
    mobile_navigation_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
