package pl.strava.analizator.domain.vo;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Power analysis data for an activity.
 * NP, IF, TSS, VI — core cycling power metrics.
 */
@Getter
@Builder
@AllArgsConstructor
public class PowerData {

    private BigDecimal normalizedPower;
    private BigDecimal intensityFactor;
    private BigDecimal trainingStressScore;
    private BigDecimal variabilityIndex;
}
