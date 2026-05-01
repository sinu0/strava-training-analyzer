package pl.strava.analizator.domain.model;

/**
 * Multi-factor fatigue analysis breaking fatigue into physiological subsystems.
 */
public record FatigueFactors(
        /** ATL-based: acute (7-day) training load above chronic load */
        double atlFatigue,
        /** Muscular fatigue: power fade + time in high-force zones (low cadence / high torque) */
        double muscularFatigue,
        /** Metabolic fatigue: time above threshold + W' depletion frequency + rapid TSS accumulation */
        double metabolicFatigue,
        /** ANS fatigue: HRV trend degradation, resting HR elevation, HR-to-power decoupling trend */
        double ansFatigue,
        /** Composite fatigue score 0–100 (higher = more fatigued / needs recovery) */
        int compositeScore,
        /** Overall status label */
        String statusLabel,
        /** Description of what's driving the fatigue */
        String description
) {}
