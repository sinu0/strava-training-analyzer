-- Custom AI prompt templates stored by users
CREATE TABLE ai_custom_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    response_format TEXT,
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ai_custom_prompts_active ON ai_custom_prompts (prediction_type)
    WHERE active = true;
