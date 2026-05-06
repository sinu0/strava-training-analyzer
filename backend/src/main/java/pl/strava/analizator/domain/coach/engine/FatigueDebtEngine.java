package pl.strava.analizator.domain.coach.engine;

import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.FatigueDebt;

public class FatigueDebtEngine {

    private static final double BASELINE_ATL_LOW = 30.0;
    private static final double BASELINE_ATL_MODERATE = 60.0;
    private static final double ATL_TIME_CONSTANT = 7.0;

    public FatigueDebt compute(AthleteContext context, double baselineAtl) {
        double atl = context.getAtl();
        double debt = atl - baselineAtl;

        int recoveryDaysNeeded = 0;
        if (debt > 20) {
            recoveryDaysNeeded = (int) Math.ceil(debt / 15.0);
        } else if (debt > 10) {
            recoveryDaysNeeded = (int) Math.ceil(debt / 10.0);
        }

        String severity;
        if (debt > 30) severity = "CRITICAL";
        else if (debt > 20) severity = "HIGH";
        else if (debt > 10) severity = "MODERATE";
        else severity = "LOW";

        return FatigueDebt.builder()
                .actualFatigue(atl)
                .baselineFatigue(baselineAtl)
                .debt(Math.max(0, debt))
                .recoveryDaysNeeded(recoveryDaysNeeded)
                .severity(severity)
                .requiresRecovery(debt > 10)
                .build();
    }

    public double computeBaselineAtl(double ctl) {
        if (ctl < BASELINE_ATL_LOW) return BASELINE_ATL_LOW;
        if (ctl < BASELINE_ATL_MODERATE) return ctl * 0.9;
        return ctl * 0.85;
    }
}
