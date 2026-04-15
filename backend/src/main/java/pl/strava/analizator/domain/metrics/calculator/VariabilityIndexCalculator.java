package pl.strava.analizator.domain.metrics.calculator;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Variability Index: NP / average power.
 * Measures how variable the power output was during the ride.
 * VI of 1.0 = perfectly steady, higher = more variable.
 */
@RequiredArgsConstructor
public class VariabilityIndexCalculator implements ActivityMetricCalculator<Double> {

    private final NormalizedPowerCalculator npCalculator;

    @Override
    public String metricName() {
        return "variability_index";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData() && activity.getAvgPowerW() != null && activity.getAvgPowerW() > 0;
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        double np = npCalculator.calculate(activity, profile);
        double avgPower = activity.getAvgPowerW();
        return Math.round(np / avgPower * 100.0) / 100.0;
    }
}
