INSERT INTO workout_templates (name, category, description, target_tss, target_duration_min, relative_effort, intensity_factor, steps, created_by)
VALUES
(
    'Regeneracja', 'RECOVERY', 'Lekki trening regeneracyjny na niskim tętnie i niskiej mocy.',
    25.00, 45, 2, 0.550,
    '[{"type":"warmup","durationSec":600,"powerPctFtpLow":45,"powerPctFtpHigh":55},{"type":"steady","durationSec":1500,"powerPctFtpLow":50,"powerPctFtpHigh":55},{"type":"cooldown","durationSec":600,"powerPctFtpLow":40,"powerPctFtpHigh":50}]',
    'system'
),
(
    'Endurance Base', 'ENDURANCE', 'Bazowy trening wytrzymałościowy w strefie Z2.',
    65.00, 90, 4, 0.650,
    '[{"type":"warmup","durationSec":900,"powerPctFtpLow":50,"powerPctFtpHigh":65},{"type":"steady","durationSec":3600,"powerPctFtpLow":60,"powerPctFtpHigh":70},{"type":"cooldown","durationSec":900,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Long Ride', 'ENDURANCE', 'Długi trening wytrzymałościowy budujący bazę aerobową.',
    130.00, 180, 5, 0.650,
    '[{"type":"warmup","durationSec":1200,"powerPctFtpLow":50,"powerPctFtpHigh":65},{"type":"steady","durationSec":8400,"powerPctFtpLow":60,"powerPctFtpHigh":70},{"type":"cooldown","durationSec":1200,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Tempo 2×20', 'TEMPO', 'Interwały tempo budujące wytrzymałość progową.',
    80.00, 75, 6, 0.780,
    '[{"type":"warmup","durationSec":600,"powerPctFtpLow":50,"powerPctFtpHigh":65},{"type":"interval","repeat":2,"onDurationSec":1200,"onPowerPctFtpLow":76,"onPowerPctFtpHigh":80,"offDurationSec":300,"offPowerPctFtpLow":45,"offPowerPctFtpHigh":55},{"type":"cooldown","durationSec":600,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Sweet Spot 2×20', 'SWEET_SPOT', 'Interwały sweet spot — efektywne budowanie FTP.',
    90.00, 75, 7, 0.880,
    '[{"type":"warmup","durationSec":600,"powerPctFtpLow":50,"powerPctFtpHigh":65},{"type":"interval","repeat":2,"onDurationSec":1200,"onPowerPctFtpLow":88,"onPowerPctFtpHigh":93,"offDurationSec":300,"offPowerPctFtpLow":45,"offPowerPctFtpHigh":55},{"type":"cooldown","durationSec":600,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Sweet Spot 3×15', 'SWEET_SPOT', 'Interwały sweet spot z krótszymi blokami.',
    95.00, 80, 7, 0.890,
    '[{"type":"warmup","durationSec":600,"powerPctFtpLow":50,"powerPctFtpHigh":65},{"type":"interval","repeat":3,"onDurationSec":900,"onPowerPctFtpLow":88,"onPowerPctFtpHigh":93,"offDurationSec":300,"offPowerPctFtpLow":45,"offPowerPctFtpHigh":55},{"type":"cooldown","durationSec":600,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Threshold 2×15', 'THRESHOLD', 'Interwały progowe rozwijające FTP.',
    85.00, 70, 8, 0.950,
    '[{"type":"warmup","durationSec":900,"powerPctFtpLow":50,"powerPctFtpHigh":70},{"type":"interval","repeat":2,"onDurationSec":900,"onPowerPctFtpLow":95,"onPowerPctFtpHigh":100,"offDurationSec":300,"offPowerPctFtpLow":45,"offPowerPctFtpHigh":55},{"type":"cooldown","durationSec":600,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Threshold 3×10', 'THRESHOLD', 'Interwały progowe z krótszymi blokami.',
    80.00, 65, 8, 0.950,
    '[{"type":"warmup","durationSec":900,"powerPctFtpLow":50,"powerPctFtpHigh":70},{"type":"interval","repeat":3,"onDurationSec":600,"onPowerPctFtpLow":95,"onPowerPctFtpHigh":100,"offDurationSec":300,"offPowerPctFtpLow":45,"offPowerPctFtpHigh":55},{"type":"cooldown","durationSec":600,"powerPctFtpLow":45,"powerPctFtpHigh":55}]',
    'system'
),
(
    'VO2max 5×4', 'VO2MAX', 'Interwały VO2max rozwijające pułap tlenowy.',
    90.00, 60, 9, 1.050,
    '[{"type":"warmup","durationSec":900,"powerPctFtpLow":50,"powerPctFtpHigh":70},{"type":"interval","repeat":5,"onDurationSec":240,"onPowerPctFtpLow":105,"onPowerPctFtpHigh":120,"offDurationSec":240,"offPowerPctFtpLow":40,"offPowerPctFtpHigh":55},{"type":"cooldown","durationSec":300,"powerPctFtpLow":40,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Anaerobic 8×30s', 'ANAEROBIC', 'Interwały anaerobowe rozwijające moc beztlenową.',
    70.00, 50, 9, 0.950,
    '[{"type":"warmup","durationSec":900,"powerPctFtpLow":50,"powerPctFtpHigh":70},{"type":"interval","repeat":8,"onDurationSec":30,"onPowerPctFtpLow":150,"onPowerPctFtpHigh":200,"offDurationSec":270,"offPowerPctFtpLow":40,"offPowerPctFtpHigh":50},{"type":"cooldown","durationSec":600,"powerPctFtpLow":40,"powerPctFtpHigh":55}]',
    'system'
),
(
    'Sprint 10×10s', 'SPRINT', 'Interwały sprintowe rozwijające moc szczytową.',
    45.00, 40, 8, 0.800,
    '[{"type":"warmup","durationSec":600,"powerPctFtpLow":50,"powerPctFtpHigh":65},{"type":"interval","repeat":10,"onDurationSec":10,"onPowerPctFtpLow":200,"onPowerPctFtpHigh":300,"offDurationSec":290,"offPowerPctFtpLow":40,"offPowerPctFtpHigh":50},{"type":"cooldown","durationSec":600,"powerPctFtpLow":40,"powerPctFtpHigh":55}]',
    'system'
);
