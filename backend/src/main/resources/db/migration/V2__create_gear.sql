CREATE TABLE gear (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id       VARCHAR(255),
    name              VARCHAR(255) NOT NULL,
    type              VARCHAR(50) DEFAULT 'bike',
    brand             VARCHAR(255),
    model             VARCHAR(255),
    weight_g          INTEGER,
    total_distance_m  DECIMAL(12,2) DEFAULT 0,
    retired           BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW()
);
