-- Default Coggan Power Zones (percentage of FTP)
INSERT INTO training_zones (zone_type, zone_number, zone_name, min_value, max_value, color, valid_from) VALUES
('power', 1, 'Active Recovery',   0,   55, '#8B949E', '2000-01-01'),
('power', 2, 'Endurance',        56,   75, '#58A6FF', '2000-01-01'),
('power', 3, 'Tempo',            76,   90, '#3FB950', '2000-01-01'),
('power', 4, 'Threshold',        91,  105, '#D29922', '2000-01-01'),
('power', 5, 'VO2max',          106,  120, '#FF6B35', '2000-01-01'),
('power', 6, 'Anaerobic',       121,  150, '#F85149', '2000-01-01'),
('power', 7, 'Neuromuscular',   151, NULL, '#BC8CFF', '2000-01-01');

-- Default Heart Rate Zones (percentage of LTHR)
INSERT INTO training_zones (zone_type, zone_number, zone_name, min_value, max_value, color, valid_from) VALUES
('heart_rate', 1, 'Recovery',      0,   68, '#8B949E', '2000-01-01'),
('heart_rate', 2, 'Aerobic',      69,   83, '#58A6FF', '2000-01-01'),
('heart_rate', 3, 'Tempo',        84,   94, '#3FB950', '2000-01-01'),
('heart_rate', 4, 'Threshold',    95,  105, '#D29922', '2000-01-01'),
('heart_rate', 5, 'Anaerobic',   106, NULL, '#F85149', '2000-01-01');
