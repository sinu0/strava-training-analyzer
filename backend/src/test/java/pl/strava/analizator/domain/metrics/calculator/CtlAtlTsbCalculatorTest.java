package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.metrics.DailyTrainingLoad;
import pl.strava.analizator.domain.model.AthleteProfile;

class CtlAtlTsbCalculatorTest {

    private final CtlAtlTsbCalculator calculator = new CtlAtlTsbCalculator();
    private final AthleteProfile profile = AthleteProfile.builder().build();

    @Test
    void calculate_emptyHistory_returnsEmptyList() {
        List<CtlAtlTsbCalculator.PmcDataPoint> result = calculator.calculate(List.of(), profile);
        assertThat(result).isEmpty();
    }

    @Test
    void calculate_singleDay_ctlAtlTsbComputed() {
        List<DailyTrainingLoad> history = List.of(
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 1)).tss(BigDecimal.valueOf(80)).build()
        );

        List<CtlAtlTsbCalculator.PmcDataPoint> result = calculator.calculate(history, profile);
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getTsb()).isCloseTo(0.0, within(0.01)); // TSB starts at 0
        assertThat(result.getFirst().getCtl()).isGreaterThan(0); // CTL increases
        assertThat(result.getFirst().getAtl()).isGreaterThan(0); // ATL increases
    }

    @Test
    void calculate_restDay_ctlDropsAtlDropsFaster() {
        // Training block then rest
        List<DailyTrainingLoad> history = new ArrayList<>();
        LocalDate start = LocalDate.of(2024, 1, 1);
        for (int i = 0; i < 14; i++) {
            history.add(DailyTrainingLoad.builder()
                    .date(start.plusDays(i))
                    .tss(BigDecimal.valueOf(80))
                    .build());
        }
        // Then rest day (gap filled with 0)
        history.add(DailyTrainingLoad.builder()
                .date(start.plusDays(15))
                .tss(BigDecimal.ZERO)
                .build());

        List<CtlAtlTsbCalculator.PmcDataPoint> result = calculator.calculate(history, profile);
        // After rest day, TSB should rise (or become less negative)
        CtlAtlTsbCalculator.PmcDataPoint lastTraining = result.get(result.size() - 2);
        CtlAtlTsbCalculator.PmcDataPoint afterRest = result.getLast();
        assertThat(afterRest.getTsb()).isGreaterThan(lastTraining.getTsb());
    }

    @Test
    void calculate_42days_emaConverges() {
        // 42 days of constant 100 TSS → CTL should approach 100
        List<DailyTrainingLoad> history = new ArrayList<>();
        LocalDate start = LocalDate.of(2024, 1, 1);
        for (int i = 0; i < 42; i++) {
            history.add(DailyTrainingLoad.builder()
                    .date(start.plusDays(i))
                    .tss(BigDecimal.valueOf(100))
                    .build());
        }

        List<CtlAtlTsbCalculator.PmcDataPoint> result = calculator.calculate(history, profile);
        CtlAtlTsbCalculator.PmcDataPoint last = result.getLast();
        // After 42 days of 100 TSS, CTL should be close to 100 (EMA converges)
        assertThat(last.getCtl()).isCloseTo(100.0, within(40.0));
        // ATL converges faster (τ=7), should be even closer to 100
        assertThat(last.getAtl()).isCloseTo(100.0, within(5.0));
    }

    @Test
    void calculate_taperBlock_tsbBecomesPositive() {
        // Heavy training then taper → TSB should transition from negative to positive
        List<DailyTrainingLoad> history = new ArrayList<>();
        LocalDate start = LocalDate.of(2024, 1, 1);
        // 21 days heavy
        for (int i = 0; i < 21; i++) {
            history.add(DailyTrainingLoad.builder()
                    .date(start.plusDays(i))
                    .tss(BigDecimal.valueOf(120))
                    .build());
        }
        // 14 days taper (light)
        for (int i = 21; i < 35; i++) {
            history.add(DailyTrainingLoad.builder()
                    .date(start.plusDays(i))
                    .tss(BigDecimal.valueOf(30))
                    .build());
        }

        List<CtlAtlTsbCalculator.PmcDataPoint> result = calculator.calculate(history, profile);
        CtlAtlTsbCalculator.PmcDataPoint last = result.getLast();
        assertThat(last.getTsb()).isGreaterThan(0); // TSB positive after taper
    }
}
