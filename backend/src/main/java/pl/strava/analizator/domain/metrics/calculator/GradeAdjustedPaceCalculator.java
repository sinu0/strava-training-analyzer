package pl.strava.analizator.domain.metrics.calculator;

import java.util.LinkedHashMap;
import java.util.Map;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Grade Adjusted Pace (GAP) calculator.
 * Adjusts running/walking pace based on terrain gradient using the Minetti cost-of-transport model.
 * Reference: Minetti et al. (2002) "Energy cost of walking and running at extreme uphill and downhill slopes."
 */
public class GradeAdjustedPaceCalculator implements ActivityMetricCalculator<Map<String, Object>> {

    @Override
    public String metricName() {
        return "grade_adjusted_pace";
    }

    @Override
    public boolean supports(Activity activity) {
        String sport = activity.getSportType();
        boolean isRunWalk = "running".equals(sport) || "walking".equals(sport);
        return isRunWalk && activity.hasVelocityData() && activity.hasAltitudeData()
                && activity.getDistanceStream() != null && activity.getDistanceStream().length > 0;
    }

    @Override
    public Map<String, Object> calculate(Activity activity, AthleteProfile profile) {
        double[] velocity = activity.getVelocityStream();
        double[] altitude = activity.getAltitudeStream();
        double[] distance = activity.getDistanceStream();
        int len = Math.min(Math.min(velocity.length, altitude.length), distance.length);

        if (len < 2) {
            return Map.of("gap_avg_speed_ms", 0.0);
        }

        double totalGapDistance = 0;
        double totalTime = 0;

        for (int i = 1; i < len; i++) {
            double dDist = distance[i] - distance[i - 1];
            double dElev = altitude[i] - altitude[i - 1];
            double speed = velocity[i];

            if (dDist < 0.1 || speed < 0.1) continue;

            double grade = dElev / dDist;
            grade = Math.max(-0.45, Math.min(0.45, grade));

            double costFactor = minettiCostFactor(grade);
            double gapSpeed = speed * costFactor;

            double dt = dDist / speed;
            totalGapDistance += gapSpeed * dt;
            totalTime += dt;
        }

        double gapAvgSpeed = totalTime > 0 ? totalGapDistance / totalTime : 0;
        double gapPaceMinPerKm = gapAvgSpeed > 0 ? 1000.0 / (gapAvgSpeed * 60.0) : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("gap_avg_speed_ms", Math.round(gapAvgSpeed * 100.0) / 100.0);
        result.put("gap_pace_min_per_km", Math.round(gapPaceMinPerKm * 100.0) / 100.0);
        return result;
    }

    /**
     * Minetti cost-of-transport model for grade adjustment.
     * Returns a factor that converts actual speed to flat-equivalent speed.
     * Positive grades (uphill) produce factor > 1, negative (downhill) produce factor < 1 (for mild grades).
     */
    private double minettiCostFactor(double grade) {
        // Cost of transport polynomial (Minetti 2002)
        // C(i) = 155.4*i^5 - 30.4*i^4 - 43.3*i^3 + 46.3*i^2 + 19.5*i + 3.6
        double i = grade;
        double cost = 155.4 * Math.pow(i, 5)
                - 30.4 * Math.pow(i, 4)
                - 43.3 * Math.pow(i, 3)
                + 46.3 * Math.pow(i, 2)
                + 19.5 * i
                + 3.6;

        // Cost at 0% grade (flat)
        double flatCost = 3.6;

        return cost / flatCost;
    }
}
