package pl.strava.analizator.domain.coach.engine;

import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.FatigueCost;

public class FatigueModel {

    private static final double ATL_TIME_CONSTANT = 7.0;
    private static final double RECENT_LOAD_WINDOW_DAYS = 7.0;
    private static final double FATIGUE_DECAY_RATE = 0.85;

    public FatigueCost compute(double sessionTss, AthleteContext context) {
        double recentLoadWeight = computeRecentLoadWeight(context);
        double decayFactor = computeDecay(context);
        double projectedAtl = computeProjectedAtl(sessionTss, context.getAtl());
        double projectedTsb = context.getCtl() - projectedAtl;

        double rawCost = sessionTss * 0.01;
        double totalCost = rawCost * recentLoadWeight * decayFactor;

        return FatigueCost.builder()
                .totalCost(Math.min(100.0, totalCost))
                .recentLoadWeight(recentLoadWeight)
                .decayFactor(decayFactor)
                .projectedAtl(projectedAtl)
                .projectedTsb(projectedTsb)
                .build();
    }

    private double computeRecentLoadWeight(AthleteContext context) {
        double atl = context.getAtl();
        double ctl = context.getCtl();

        if (atl <= 0) return 1.0;

        double ratio = ctl > 0 ? atl / ctl : 1.0;

        if (ratio > 1.5) return 1.8;
        if (ratio > 1.3) return 1.5;
        if (ratio > 1.1) return 1.2;
        if (ratio > 0.9) return 1.0;
        if (ratio > 0.7) return 0.85;
        return 0.7;
    }

    private double computeDecay(AthleteContext context) {
        double monotony = context.getTrainingMonotony();
        double tsb = context.getTsb();

        double monotonyPenalty = Math.min(1.5, 1.0 + Math.max(0, (monotony - 1.5) * 0.3));

        double tsbEffect = 1.0;
        if (tsb < -30) tsbEffect = 1.4;
        else if (tsb < -20) tsbEffect = 1.25;
        else if (tsb < -10) tsbEffect = 1.1;
        else if (tsb > 10) tsbEffect = 0.8;
        else if (tsb > 5) tsbEffect = 0.9;

        return monotonyPenalty * tsbEffect;
    }

    private double computeProjectedAtl(double sessionTss, double currentAtl) {
        return currentAtl + (sessionTss - currentAtl) / ATL_TIME_CONSTANT;
    }
}
