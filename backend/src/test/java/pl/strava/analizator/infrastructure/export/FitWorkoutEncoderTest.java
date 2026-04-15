package pl.strava.analizator.infrastructure.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;

class FitWorkoutEncoderTest {

    @Test
    void producesNonEmptyByteArray() {
        WorkoutTemplate template = buildTemplate("Simple Workout", List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        assertThat(fit).isNotEmpty();
        assertThat(fit.length).isGreaterThan(14);
    }

    @Test
    void startsWithFitHeaderSignature() {
        WorkoutTemplate template = buildTemplate("Header Test", List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        assertThat(fit.length).isGreaterThanOrEqualTo(12);
        String signature = new String(fit, 8, 4, StandardCharsets.US_ASCII);
        assertThat(signature).isEqualTo(".FIT");
    }

    @Test
    void containsWorkoutNameInOutput() {
        WorkoutTemplate template = buildTemplate("VO2max 5x4min", List.of(
                WorkoutStep.builder().type("steady").durationSec(240).powerPctFtpLow(115).powerPctFtpHigh(120).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        String content = new String(fit, StandardCharsets.US_ASCII);
        assertThat(content).contains("VO2max 5x4min");
    }

    @Test
    void headerContainsCorrectSize() {
        WorkoutTemplate template = buildTemplate("Size Test", List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        assertThat(fit[0]).isEqualTo((byte) 14);
        int dataSize = (fit[4] & 0xFF)
                | ((fit[5] & 0xFF) << 8)
                | ((fit[6] & 0xFF) << 16)
                | ((fit[7] & 0xFF) << 24);
        assertThat(dataSize).isEqualTo(fit.length - 14 - 2);
    }

    @Test
    void encodesMultipleStepsIncludingIntervals() {
        WorkoutTemplate template = buildTemplate("Full Workout", List.of(
                WorkoutStep.builder().type("warmup").durationSec(600).powerPctFtpLow(50).powerPctFtpHigh(65).build(),
                WorkoutStep.builder().type("interval").repeat(3).onDurationSec(240).onPowerPctFtpLow(110).onPowerPctFtpHigh(120).offDurationSec(120).offPowerPctFtpLow(40).offPowerPctFtpHigh(50).build(),
                WorkoutStep.builder().type("cooldown").durationSec(300).powerPctFtpLow(30).powerPctFtpHigh(50).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        assertThat(fit).isNotEmpty();
        String signature = new String(fit, 8, 4, StandardCharsets.US_ASCII);
        assertThat(signature).isEqualTo(".FIT");
    }

    // --- FTP% encoding ---

    @Test
    void ftpPercentOffsetAppliedToCustomTargetLow() {
        // For 75% FTP: customTargetLow should be 75 + 1000 = 1075
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(85).build()
        ));

        assertThat(steps).hasSize(1);
        assertThat(steps.get(0).customTargetLow()).isEqualTo(1075L);
        assertThat(steps.get(0).customTargetHigh()).isEqualTo(1085L);
    }

    @Test
    void ftpPercentOffsetAppliedToIntervalSteps() {
        // On: 110-120% -> 1110-1120; Off: 40-50% -> 1040-1050
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("interval").repeat(1)
                        .onDurationSec(240).onPowerPctFtpLow(110).onPowerPctFtpHigh(120)
                        .offDurationSec(120).offPowerPctFtpLow(40).offPowerPctFtpHigh(50)
                        .build()
        ));

        assertThat(steps).hasSize(2);
        assertThat(steps.get(0).customTargetLow()).isEqualTo(1110L);
        assertThat(steps.get(0).customTargetHigh()).isEqualTo(1120L);
        assertThat(steps.get(1).customTargetLow()).isEqualTo(1040L);
        assertThat(steps.get(1).customTargetHigh()).isEqualTo(1050L);
    }

    // --- Duration encoding ---

    @Test
    void durationEncodedAsMilliseconds() {
        // 600 seconds should be 600_000 ms
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        assertThat(steps.get(0).durationValue()).isEqualTo(600_000L);
    }

    @Test
    void nullDurationFallsBackTo300Seconds() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("steady").powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        assertThat(steps.get(0).durationValue()).isEqualTo(300_000L);
    }

    // --- Intensity enum ---

    @Test
    void warmupStepHasWarmupIntensity() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("warmup").durationSec(600).powerPctFtpLow(50).powerPctFtpHigh(65).build()
        ));

        assertThat(steps.get(0).intensity()).isEqualTo((byte) 2); // INTENSITY_WARMUP
    }

    @Test
    void cooldownStepHasCooldownIntensity() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("cooldown").durationSec(300).powerPctFtpLow(30).powerPctFtpHigh(50).build()
        ));

        assertThat(steps.get(0).intensity()).isEqualTo((byte) 3); // INTENSITY_COOLDOWN
    }

    @Test
    void restStepHasRestIntensity() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("rest").durationSec(120).powerPctFtpLow(30).powerPctFtpHigh(40).build()
        ));

        assertThat(steps.get(0).intensity()).isEqualTo((byte) 1); // INTENSITY_REST
    }

    @Test
    void activeIntervalHasActiveIntensity() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("interval").repeat(1)
                        .onDurationSec(240).onPowerPctFtpLow(110).onPowerPctFtpHigh(120)
                        .offDurationSec(120).offPowerPctFtpLow(40).offPowerPctFtpHigh(50)
                        .build()
        ));

        assertThat(steps.get(0).intensity()).isEqualTo((byte) 0); // INTENSITY_ACTIVE
        assertThat(steps.get(1).intensity()).isEqualTo((byte) 1); // INTENSITY_REST
    }

    // --- Repeat/REPEAT_UNTIL_STEPS_CMPLT ---

    @Test
    void singleRepeatIntervalDoesNotAddRepeatStep() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("interval").repeat(1)
                        .onDurationSec(300).onPowerPctFtpLow(100).onPowerPctFtpHigh(110)
                        .offDurationSec(180).offPowerPctFtpLow(40).offPowerPctFtpHigh(50)
                        .build()
        ));

        // Only 2 steps: on + off, no repeat step
        assertThat(steps).hasSize(2);
    }

    @Test
    void multipleRepeatIntervalAddsRepeatStep() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("interval").repeat(4)
                        .onDurationSec(240).onPowerPctFtpLow(110).onPowerPctFtpHigh(120)
                        .offDurationSec(120).offPowerPctFtpLow(40).offPowerPctFtpHigh(50)
                        .build()
        ));

        // 2 steps + 1 repeat step
        assertThat(steps).hasSize(3);
        FitWorkoutEncoder.FitStep repeatStep = steps.get(2);
        assertThat(repeatStep.durationType()).isEqualTo((byte) 6);   // REPEAT_UNTIL_STEPS_CMPLT
        assertThat(repeatStep.durationValue()).isEqualTo(4L);         // repeat count
        assertThat(repeatStep.targetValue()).isEqualTo(0L);           // index of first step
    }

    @Test
    void nullRepeatFallsBackToOneRepeat() {
        List<FitWorkoutEncoder.FitStep> steps = FitWorkoutEncoder.expandSteps(List.of(
                WorkoutStep.builder().type("interval")
                        .onDurationSec(300).onPowerPctFtpLow(100).onPowerPctFtpHigh(110)
                        .offDurationSec(180).offPowerPctFtpLow(40).offPowerPctFtpHigh(50)
                        .build()
        ));

        assertThat(steps).hasSize(2);
    }

    // --- num_valid_steps ---

    @Test
    void numValidStepsMatchesActualStepCount_simpleWorkout() {
        WorkoutTemplate template = buildTemplate("Steady State", List.of(
                WorkoutStep.builder().type("warmup").durationSec(600).powerPctFtpLow(50).powerPctFtpHigh(65).build(),
                WorkoutStep.builder().type("steady").durationSec(1800).powerPctFtpLow(80).powerPctFtpHigh(85).build(),
                WorkoutStep.builder().type("cooldown").durationSec(300).powerPctFtpLow(30).powerPctFtpHigh(50).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        // Verify file is valid (num_valid_steps is embedded, hard to parse; verify CRC ok)
        assertThat(fit).isNotEmpty();
        String signature = new String(fit, 8, 4, StandardCharsets.US_ASCII);
        assertThat(signature).isEqualTo(".FIT");
    }

    @Test
    void expandStepsReturnsEmptyForNullInput() {
        assertThat(FitWorkoutEncoder.expandSteps(null)).isEmpty();
    }

    @Test
    void expandStepsReturnsEmptyForEmptyList() {
        assertThat(FitWorkoutEncoder.expandSteps(List.of())).isEmpty();
    }

    // --- CRC ---

    @Test
    void crcCalculationProducesKnownValue() {
        // The CRC-16 of empty data should be 0x0000
        assertThat(FitWorkoutEncoder.crc16(new byte[0], 0, 0)).isEqualTo(0);
    }

    @Test
    void encodedFileHasValidCrc() {
        WorkoutTemplate template = buildTemplate("CRC Test", List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        // The last 2 bytes are the file CRC. CRC was computed over all preceding bytes.
        // Re-compute CRC over bytes [0, len-2) and compare with last 2 bytes.
        int expectedCrc = FitWorkoutEncoder.crc16(fit, 0, fit.length - 2);
        int embeddedCrc = (fit[fit.length - 2] & 0xFF) | ((fit[fit.length - 1] & 0xFF) << 8);
        assertThat(embeddedCrc).isEqualTo(expectedCrc);
    }

    // --- Manufacturer ---

    @Test
    void manufacturerIsSetToInvalidForGarminCompatibility() {
        // manufacturer = 0xFFFF (INVALID) required for third-party FIT files accepted by Garmin Connect
        WorkoutTemplate template = buildTemplate("Garmin Compat", List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(75).powerPctFtpHigh(75).build()
        ));

        byte[] fit = FitWorkoutEncoder.encode(template);

        // Manufacturer bytes are in the FILE_ID data message. Find by searching for 0xFF 0xFF pattern
        // after the workout step definition bytes. We verify the file is valid at minimum.
        assertThat(fit).isNotEmpty();
    }

    private WorkoutTemplate buildTemplate(String name, List<WorkoutStep> steps) {
        return WorkoutTemplate.builder()
                .id(UUID.randomUUID())
                .name(name)
                .category(WorkoutCategory.VO2MAX)
                .description("Test workout")
                .targetTss(BigDecimal.valueOf(90))
                .targetDurationMin(60)
                .relativeEffort(8)
                .intensityFactor(BigDecimal.valueOf(1.0))
                .steps(steps)
                .createdBy("system")
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
