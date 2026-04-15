package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class WPrimeBalanceCalculatorTest {

    private final WPrimeBalanceCalculator calculator = new WPrimeBalanceCalculator();

    @Test
    void supports_trueWithLongPowerStreamAndFtp() {
        Activity activity = Activity.builder()
                .powerStream(new int[120])
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_falseWithoutPowerStream() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_falseWithShortPowerStream() {
        Activity activity = Activity.builder()
                .powerStream(new int[30])
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_falseWithExactlyMinLength() {
        Activity activity = Activity.builder()
                .powerStream(new int[60])
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_constantPowerAboveCp_balanceDecreases() {
        // FTP 250 → CP = 190. Constant 300W (above CP) should deplete W'bal.
        int[] power = new int[300];
        for (int i = 0; i < 300; i++) power[i] = 300;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        WPrimeBalanceResult result = calculator.calculate(activity, profile);

        assertThat(result.criticalPower()).isCloseTo(190.0, within(0.1));
        assertThat(result.minBalance()).isLessThan(result.wPrime());
        assertThat(result.avgBalance()).isLessThan(result.wPrime());
        // Power is continuously above CP → balance should drop significantly
        assertThat(result.minBalance()).isLessThan(result.wPrime() * 0.5);
    }

    @Test
    void calculate_constantPowerBelowCp_balanceStaysHigh() {
        // FTP 250 → CP = 190. Constant 100W (below CP) → W'bal stays near max.
        int[] power = new int[300];
        for (int i = 0; i < 300; i++) power[i] = 100;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        WPrimeBalanceResult result = calculator.calculate(activity, profile);

        assertThat(result.minBalance()).isCloseTo(result.wPrime(), within(result.wPrime() * 0.01));
        assertThat(result.secondsBelowFiftyPct()).isZero();
        assertThat(result.secondsBelowTwentyFivePct()).isZero();
        assertThat(result.depletionEvents()).isZero();
    }

    @Test
    void calculate_mixedPower_depletionEventsCounted() {
        // FTP 250 → CP = 190
        // Pattern: 120s at 400W (deplete), 180s at 100W (recover), 120s at 400W (deplete again)
        int[] power = new int[420];
        for (int i = 0; i < 120; i++) power[i] = 400;
        for (int i = 120; i < 300; i++) power[i] = 100;
        for (int i = 300; i < 420; i++) power[i] = 400;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        WPrimeBalanceResult result = calculator.calculate(activity, profile);

        assertThat(result.depletionEvents()).isGreaterThanOrEqualTo(1);
        assertThat(result.secondsBelowFiftyPct()).isGreaterThan(0);
        assertThat(result.balanceOverTime()).hasSize(420);
    }

    @Test
    void calculate_balanceNeverGoesNegative() {
        // Very high power for extended period to try to force negative
        int[] power = new int[600];
        for (int i = 0; i < 600; i++) power[i] = 800;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 200).build();

        WPrimeBalanceResult result = calculator.calculate(activity, profile);

        assertThat(result.minBalance()).isGreaterThanOrEqualTo(0.0);
        for (double bal : result.balanceOverTime()) {
            assertThat(bal).isGreaterThanOrEqualTo(0.0);
        }
    }

    @Test
    void calculate_balanceNeverExceedsWPrime() {
        int[] power = new int[300];
        for (int i = 0; i < 300; i++) power[i] = 50;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        WPrimeBalanceResult result = calculator.calculate(activity, profile);

        for (double bal : result.balanceOverTime()) {
            assertThat(bal).isLessThanOrEqualTo(result.wPrime());
        }
    }

    @Test
    void calculate_outputArrayMatchesPowerStreamLength() {
        int[] power = new int[200];
        for (int i = 0; i < 200; i++) power[i] = 250;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 250).build();

        WPrimeBalanceResult result = calculator.calculate(activity, profile);

        assertThat(result.balanceOverTime()).hasSize(200);
    }
}
