CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    replacement_interval_km INTEGER,
    total_km DOUBLE PRECISION DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE equipment_activity (
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (equipment_id, activity_id)
);
CREATE INDEX idx_equip_activity ON equipment_activity(activity_id);
