CREATE TABLE ai_predictions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type     VARCHAR(50) NOT NULL,
    model_id            VARCHAR(100) NOT NULL,
    provider_name       VARCHAR(50) NOT NULL,
    summary             TEXT,
    detail              TEXT,
    structured_data     JSONB,
    confidence          DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type, created_at DESC);
CREATE INDEX idx_ai_predictions_created ON ai_predictions(created_at DESC);
