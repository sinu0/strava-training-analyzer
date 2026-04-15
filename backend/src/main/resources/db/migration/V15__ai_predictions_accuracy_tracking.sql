-- Accuracy tracking: actual values + accuracy score for comparing predictions with reality
ALTER TABLE ai_predictions
    ADD COLUMN actual_data jsonb,
    ADD COLUMN accuracy_score DECIMAL(4,3),
    ADD COLUMN verified_at TIMESTAMP;

CREATE INDEX idx_ai_predictions_verified ON ai_predictions (verified_at)
    WHERE verified_at IS NOT NULL;
