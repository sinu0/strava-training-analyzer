package pl.strava.analizator.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import pl.strava.analizator.domain.metrics.LapMetricsService;
import pl.strava.analizator.domain.metrics.calculator.AerobicDecouplingCalculator;
import pl.strava.analizator.domain.metrics.calculator.CtlAtlTsbCalculator;
import pl.strava.analizator.domain.metrics.calculator.EfficiencyFactorCalculator;
import pl.strava.analizator.domain.metrics.calculator.GradeAdjustedPaceCalculator;
import pl.strava.analizator.domain.metrics.calculator.HeartRateTssCalculator;
import pl.strava.analizator.domain.metrics.calculator.IntensityFactorCalculator;
import pl.strava.analizator.domain.metrics.calculator.NormalizedPowerCalculator;
import pl.strava.analizator.domain.metrics.calculator.PeakEffortCalculator;
import pl.strava.analizator.domain.metrics.calculator.PowerFadeCalculator;
import pl.strava.analizator.domain.metrics.calculator.PowerCurveCalculator;
import pl.strava.analizator.domain.metrics.calculator.TimeInZonesCalculator;
import pl.strava.analizator.domain.metrics.calculator.TRIMPCalculator;
import pl.strava.analizator.domain.metrics.calculator.TrainingMonotonyCalculator;
import pl.strava.analizator.domain.metrics.calculator.TrainingStressScoreCalculator;
import pl.strava.analizator.domain.metrics.calculator.VariabilityIndexCalculator;
import pl.strava.analizator.domain.metrics.calculator.WPrimeBalanceCalculator;

@Configuration
public class MetricsConfig {

    @Bean
    public LapMetricsService lapMetricsService() {
        return new LapMetricsService();
    }

    @Bean
    public NormalizedPowerCalculator normalizedPowerCalculator() {
        return new NormalizedPowerCalculator();
    }

    @Bean
    public IntensityFactorCalculator intensityFactorCalculator(NormalizedPowerCalculator npCalc) {
        return new IntensityFactorCalculator(npCalc);
    }

    @Bean
    public TrainingStressScoreCalculator trainingStressScoreCalculator(NormalizedPowerCalculator npCalc) {
        return new TrainingStressScoreCalculator(npCalc);
    }

    @Bean
    public HeartRateTssCalculator heartRateTssCalculator() {
        return new HeartRateTssCalculator();
    }

    @Bean
    public TimeInZonesCalculator timeInZonesCalculator() {
        return new TimeInZonesCalculator();
    }

    @Bean
    public EfficiencyFactorCalculator efficiencyFactorCalculator(NormalizedPowerCalculator npCalc) {
        return new EfficiencyFactorCalculator(npCalc);
    }

    @Bean
    public AerobicDecouplingCalculator aerobicDecouplingCalculator() {
        return new AerobicDecouplingCalculator();
    }

    @Bean
    public PowerFadeCalculator powerFadeCalculator() {
        return new PowerFadeCalculator();
    }

    @Bean
    public PowerCurveCalculator powerCurveCalculator() {
        return new PowerCurveCalculator();
    }

    @Bean
    public CtlAtlTsbCalculator ctlAtlTsbCalculator() {
        return new CtlAtlTsbCalculator();
    }

    @Bean
    public TrainingMonotonyCalculator trainingMonotonyCalculator() {
        return new TrainingMonotonyCalculator();
    }

    @Bean
    public TRIMPCalculator trimpCalculator() {
        return new TRIMPCalculator();
    }

    @Bean
    public VariabilityIndexCalculator variabilityIndexCalculator(NormalizedPowerCalculator npCalc) {
        return new VariabilityIndexCalculator(npCalc);
    }

    @Bean
    public PeakEffortCalculator peakEffortCalculator() {
        return new PeakEffortCalculator();
    }

    @Bean
    public GradeAdjustedPaceCalculator gradeAdjustedPaceCalculator() {
        return new GradeAdjustedPaceCalculator();
    }

    @Bean
    public WPrimeBalanceCalculator wPrimeBalanceCalculator() {
        return new WPrimeBalanceCalculator();
    }
}
