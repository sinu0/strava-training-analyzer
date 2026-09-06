-- Derived values calculated before activity power provenance was persisted may
-- have treated unverified power as measured. Remove only reproducible derived
-- metrics so the application reports UNKNOWN until the strict calculator runs.
DELETE FROM daily_metric_values
WHERE metric_name IN (
    'daily_tss',
    'ctl',
    'atl',
    'tsb',
    'readiness',
    'training_monotony',
    'training_monotony_warning',
    'training_strain',
    'training_load_coverage',
    'training_load_provenance',
    'ftp',
    'normalized_power',
    'efficiency_factor'
);
