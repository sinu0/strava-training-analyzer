CREATE TABLE training_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_type       VARCHAR(20) NOT NULL,
    zone_number     SMALLINT NOT NULL,
    zone_name       VARCHAR(100),
    min_value       SMALLINT NOT NULL,
    max_value       SMALLINT,
    color           VARCHAR(7),
    valid_from      DATE NOT NULL,
    valid_to        DATE,

    CONSTRAINT uq_zone UNIQUE (zone_type, zone_number, valid_from)
);
