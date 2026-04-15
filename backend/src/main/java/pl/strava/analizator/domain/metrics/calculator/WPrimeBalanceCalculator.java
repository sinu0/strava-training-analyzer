package pl.strava.analizator.domain.metrics.calculator;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * W' Balance calculator using the Skiba integral model.
 * <p>
 * Tracks the depletion and reconstitution of the anaerobic work capacity (W')
 * second-by-second throughout an activity. Requires power data and a known FTP.
 */
public class WPrimeBalanceCalculator implements ActivityMetricCalculator<WPrimeBalanceResult> {

    private static final double DEFAULT_W_PRIME = 15000.0;
    private static final double CP_FTP_RATIO = 0.76;
    private static final double TAU = 546.0;
    private static final int MIN_POWER_STREAM_LENGTH = 60;

    @Override
    public String metricName() {
        return "w_prime_balance";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData()
                && activity.getPowerStream().length > MIN_POWER_STREAM_LENGTH;
    }

    @Override
    public WPrimeBalanceResult calculate(Activity activity, AthleteProfile profile) {
        int[] power = activity.getPowerStream();
        double cp = profile.getFtpWatts() * CP_FTP_RATIO;
        double wPrime = DEFAULT_W_PRIME;
        double wBal = wPrime;

        double minWBal = wPrime;
        double sumWBal = 0;
        int timeBelowFifty = 0;
        int timeBelowTwentyFive = 0;
        int depletionEvents = 0;
        boolean wasAboveTwentyFive = true;

        double[] wBalArray = new double[power.length];

        for (int t = 0; t < power.length; t++) {
            double p = power[t];
            if (p > cp) {
                wBal -= (p - cp);
            } else {
                wBal += (wPrime - wBal) * (1 - Math.exp(-(cp - p) / (wPrime / TAU)));
            }
            wBal = Math.max(0, Math.min(wPrime, wBal));
            wBalArray[t] = wBal;

            minWBal = Math.min(minWBal, wBal);
            sumWBal += wBal;

            double pct = wBal / wPrime * 100;
            if (pct < 50) {
                timeBelowFifty++;
            }
            if (pct < 25) {
                timeBelowTwentyFive++;
                if (wasAboveTwentyFive) {
                    depletionEvents++;
                    wasAboveTwentyFive = false;
                }
            } else {
                wasAboveTwentyFive = true;
            }
        }

        return new WPrimeBalanceResult(
                wPrime,
                cp,
                minWBal,
                sumWBal / power.length,
                timeBelowFifty,
                timeBelowTwentyFive,
                depletionEvents,
                wBalArray
        );
    }
}
