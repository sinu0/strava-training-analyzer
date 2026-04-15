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

class TrainingMonotonyCalculatorTest {

    private final TrainingMonotonyCalculator calculator = new TrainingMonotonyCalculator();
    private final AthleteProfile profile = AthleteProfile.builder().build();

    @Test
    void calculate_emptyHistory_returnsZeros() {
        TrainingMonotonyCalculator.MonotonyStrain result = calculator.calculate(List.of(), profile);
        assertThat(result.getMonotony()).isEqualTo(0);
        assertThat(result.getStrain()).isEqualTo(0);
    }

    @Test
    void calculate_identicalTss_infiniteMonotony() {
        // 7 days all 80 TSS → stdev = 0 → monotony = infinity
        List<DailyTrainingLoad> history = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            history.add(DailyTrainingLoad.builder()
                    .date(LocalDate.of(2024, 1, 1).plusDays(i))
                    .tss(BigDecimal.valueOf(80))
                    .build());
        }

        TrainingMonotonyCalculator.MonotonyStrain result = calculator.calculate(history, profile);
        assertThat(result.getMonotony()).isInfinite();
        assertThat(result.isWarning()).isTrue();
    }

    @Test
    void calculate_variedTss_correctValues() {
        // Known values: [100, 60, 80, 0, 90, 50, 70] → mean=64.29, stdev=31.08
        // Monotony = 64.29 / 31.08 ≈ 2.069
        // Strain = 450 × 2.069 ≈ 930.9
        List<DailyTrainingLoad> history = List.of(
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 1)).tss(BigDecimal.valueOf(100)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 2)).tss(BigDecimal.valueOf(60)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 3)).tss(BigDecimal.valueOf(80)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 4)).tss(BigDecimal.ZERO).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 5)).tss(BigDecimal.valueOf(90)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 6)).tss(BigDecimal.valueOf(50)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 7)).tss(BigDecimal.valueOf(70)).build()
        );

        TrainingMonotonyCalculator.MonotonyStrain result = calculator.calculate(history, profile);
        assertThat(result.getMonotony()).isCloseTo(2.07, within(0.1));
        assertThat(result.getStrain()).isGreaterThan(400);
        assertThat(result.isWarning()).isTrue(); // Both monotony > 2.0 and strain > 400
    }

    @Test
    void calculate_wellVariedTraining_noWarning() {
        // Well varied: [120, 0, 80, 0, 60, 0, 40] → low monotony
        List<DailyTrainingLoad> history = List.of(
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 1)).tss(BigDecimal.valueOf(120)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 2)).tss(BigDecimal.ZERO).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 3)).tss(BigDecimal.valueOf(80)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 4)).tss(BigDecimal.ZERO).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 5)).tss(BigDecimal.valueOf(60)).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 6)).tss(BigDecimal.ZERO).build(),
                DailyTrainingLoad.builder().date(LocalDate.of(2024, 1, 7)).tss(BigDecimal.valueOf(40)).build()
        );

        TrainingMonotonyCalculator.MonotonyStrain result = calculator.calculate(history, profile);
        assertThat(result.getMonotony()).isLessThan(2.0);
    }
}
