CREATE TABLE weather_locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    latitude        DECIMAL(8,5) NOT NULL,
    longitude       DECIMAL(8,5) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert Kraków as a default active location
INSERT INTO weather_locations (name, latitude, longitude, is_active)
VALUES ('Kraków', 50.06, 19.94, true);
