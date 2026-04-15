CREATE TABLE activity_metrics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id         UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    metric_name         VARCHAR(100) NOT NULL,
    value_numeric       DECIMAL(12,4),
    value_json          JSONB,
    calculator_version  VARCHAR(20),
    calculated_at       TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_activity_metric UNIQUE (activity_id, metric_name)
);

CREATE INDEX idx_activity_metrics_name ON activity_metrics(metric_name);
CREATE INDEX idx_activity_metrics_activity ON activity_metrics(activity_id);
