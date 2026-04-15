CREATE TABLE weight_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weight_kg       DECIMAL(5,2) NOT NULL,
    recorded_date   DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_weight_history_date ON weight_history(recorded_date);
CREATE INDEX idx_weight_history_date ON weight_history(recorded_date DESC);

CREATE TABLE weight_goal (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_weight_kg DECIMAL(5,2) NOT NULL,
    target_date     DATE NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
