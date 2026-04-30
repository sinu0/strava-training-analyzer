CREATE TABLE daily_metric_values (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date                DATE NOT NULL,
    metric_name         VARCHAR(100) NOT NULL,
    value_numeric       DECIMAL(12,4),
    value_json          JSONB,
    calculator_version  VARCHAR(20),
    calculated_at       TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_daily_metric UNIQUE (date, metric_name)
);

CREATE INDEX idx_daily_metric_date ON daily_metric_values(date DESC);
CREATE INDEX idx_daily_metric_name ON daily_metric_values(metric_name, date DESC);
