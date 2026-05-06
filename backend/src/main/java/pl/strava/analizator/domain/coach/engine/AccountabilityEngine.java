package pl.strava.analizator.domain.coach.engine;

import pl.strava.analizator.domain.coach.model.AccountabilityReport;
import pl.strava.analizator.domain.coach.model.AccountabilityStatus;
import pl.strava.analizator.domain.coach.model.AthleteContext;

public class AccountabilityEngine {

    private static final double UNDERTRAINING_THRESHOLD = 0.6;
    private static final double OVERTRAINING_ATL_RATIO = 1.4;
    private static final double OVERTRAINING_TSB = -25.0;
    private static final double OPTIMAL_LOWER = 0.8;
    private static final double OPTIMAL_UPPER = 1.2;

    public AccountabilityReport evaluate(double actualLoad, double expectedLoad,
                                          AthleteContext context) {
        double ratio = expectedLoad > 0 ? actualLoad / expectedLoad : 0;
        double gap = expectedLoad - actualLoad;

        AccountabilityStatus status;
        String message;
        String action;

        boolean isOverreaching = context.getAtl() > 0 && context.getCtl() > 0
                && context.getAtl() / context.getCtl() > OVERTRAINING_ATL_RATIO
                || context.getTsb() < OVERTRAINING_TSB;

        if (ratio < UNDERTRAINING_THRESHOLD) {
            status = AccountabilityStatus.UNDERTRAINING;
            message = String.format("Training volume is %.0f%% below target. Adaptations are limited.",
                    (1.0 - ratio) * 100);
            action = "Increase session frequency with shorter rides. Prioritize consistency over volume.";
        } else if (isOverreaching) {
            status = AccountabilityStatus.OVERTRAINING;
            message = "Training load is excessive — fatigue is accumulating faster than adaptation.";
            action = "Reduce intensity immediately. Insert recovery days. Monitor HRV and sleep.";
        } else if (ratio >= OPTIMAL_LOWER && ratio <= OPTIMAL_UPPER) {
            status = AccountabilityStatus.OPTIMAL;
            message = "Training load is optimal — good balance between stimulus and recovery.";
            action = "Maintain current load. Progressive overload can be applied if all signals are green.";
        } else if (ratio < OPTIMAL_LOWER) {
            status = AccountabilityStatus.UNDERTRAINING;
            message = String.format("Training is %.0f%% below optimal range.", (OPTIMAL_LOWER - ratio) * 100);
            action = "Gradually increase weekly volume by 5-10% until reaching the optimal zone.";
        } else {
            status = AccountabilityStatus.OVERTRAINING;
            message = "Training is above optimal range — risk of overreaching.";
            action = "Reduce volume by 10-20%. Focus on quality over quantity.";
        }

        double timelineAdjustment = status == AccountabilityStatus.UNDERTRAINING
                ? (1.0 - ratio) * 14 : 0;

        return AccountabilityReport.builder()
                .status(status)
                .actualLoad(actualLoad)
                .expectedLoad(expectedLoad)
                .gap(gap)
                .message(message)
                .recommendedAction(action)
                .timelineAdjustmentDays(timelineAdjustment)
                .build();
    }
}
