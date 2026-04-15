package pl.strava.analizator.domain.model;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Current athlete state — snapshot of all key metrics at a given point in time.
 * Used by TrainingAdvisor implementations to generate recommendations.
 */
@Getter
@Builder
@AllArgsConstructor
public class AthleteState {

    private BigDecimal ctl;
    private BigDecimal atl;
    private BigDecimal tsb;
    private BigDecimal trainingMonotony;
    private BigDecimal trainingStrain;

    private Short restingHrBpm;
    private BigDecimal baselineRestingHr;
    private BigDecimal hrvRmssd;
    private BigDecimal baselineHrv;

    private Short sleepScore;
    private Short bodyBattery;
    private Short stressAvg;

    private BigDecimal readinessScore;

    /**
     * How far current resting HR deviates from baseline (positive = elevated).
     */
    public BigDecimal restingHrDeviation() {
        if (restingHrBpm == null || baselineRestingHr == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(restingHrBpm).subtract(baselineRestingHr);
    }

    public boolean isOverreaching() {
        return tsb != null && tsb.doubleValue() < -20;
    }

    public boolean isFresh() {
        return tsb != null && tsb.doubleValue() > 5;
    }
}
