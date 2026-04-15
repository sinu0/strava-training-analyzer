package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class TrainingStressScoreCalculatorTest {

    private final NormalizedPowerCalculator npCalc = new NormalizedPowerCalculator();
    private final TrainingStressScoreCalculator calculator = new TrainingStressScoreCalculator(npCalc);

    @Test
    void calculate_oneHourAtFtp_tssApprox100() {
        // 1 hour at FTP → TSS ≈ 100
        int[] power = new int[3600];
        for (int i = 0; i < 3600; i++) power[i] = 250;
        Activity activity = Activity.builder()
                .powerStream(power)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        double tss = calculator.calculate(activity, profile);
        assertThat(tss).isCloseTo(100.0, within(1.0));
    }

    @Test
    void calculate_recoveryRide_tssBelow50() {
        // 1 hour at 60% FTP → TSS < 50
        int[] power = new int[3600];
        for (int i = 0; i < 3600; i++) power[i] = 150; // 60% of 250
        Activity activity = Activity.builder()
                .powerStream(power)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        double tss = calculator.calculate(activity, profile);
        assertThat(tss).isLessThan(50);
    }

    @Test
    void calculate_noFtp_throwsException() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200})
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        assertThatThrownBy(() -> calculator.calculate(activity, profile))
                .isInstanceOf(MetricCalculationException.class);
    }

    @Test
    void supports_returnsFalseWithoutPower() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }
}
