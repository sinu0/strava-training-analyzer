package pl.strava.analizator.domain.vo;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Heart rate analysis data for an activity.
 */
@Getter
@Builder
@AllArgsConstructor
public class HeartRateData {

    private Short avgHeartrate;
    private Short maxHeartrate;
    private BigDecimal hrTss;
    private BigDecimal efficiencyFactor;
    private BigDecimal aerobicDecoupling;
}
