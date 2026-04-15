package pl.strava.analizator.domain.metrics.calculator;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pl.strava.analizator.domain.metrics.DailyTrainingLoad;
import pl.strava.analizator.domain.metrics.TimeSeriesMetricCalculator;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Training Monotony & Strain calculator.
 * Monotony = mean(daily_TSS) / stdev(daily_TSS)
 * Strain = sum(daily_TSS) × Monotony
 * Monotony > 2.0 → overtraining risk
 * Strain > 400 → illness/injury risk
 */
public class TrainingMonotonyCalculator implements TimeSeriesMetricCalculator<TrainingMonotonyCalculator.MonotonyStrain> {

    @Override
    public String metricName() {
        return "training_monotony";
    }

    @Override
    public MonotonyStrain calculate(List<DailyTrainingLoad> history, AthleteProfile profile) {
        if (history == null || history.isEmpty()) {
            return MonotonyStrain.builder()
                    .monotony(0)
                    .strain(0)
                    .warning(false)
                    .build();
        }

        double[] tssValues = history.stream()
                .mapToDouble(d -> d.getTss().doubleValue())
                .toArray();

        double sum = 0;
        for (double v : tssValues) {
            sum += v;
        }
        double mean = sum / tssValues.length;

        double varianceSum = 0;
        for (double v : tssValues) {
            double diff = v - mean;
            varianceSum += diff * diff;
        }
        double stdev = Math.sqrt(varianceSum / tssValues.length);

        double monotony;
        if (stdev == 0) {
            // All days identical TSS → monotony is effectively infinite
            monotony = Double.POSITIVE_INFINITY;
        } else {
            monotony = mean / stdev;
        }

        double strain = sum * (Double.isInfinite(monotony) ? 0 : monotony);

        return MonotonyStrain.builder()
                .monotony(monotony)
                .strain(strain)
                .warning(monotony > 2.0 || strain > 400)
                .build();
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class MonotonyStrain {
        private final double monotony;
        private final double strain;
        private final boolean warning;
    }
}
