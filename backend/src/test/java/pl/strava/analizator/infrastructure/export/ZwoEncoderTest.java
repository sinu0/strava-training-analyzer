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

class ZwoEncoderTest {

    @Test
    void encodesWarmupStepCorrectly() {
        WorkoutTemplate template = buildTemplate("Warmup Only", List.of(
                WorkoutStep.builder()
                        .type("warmup")
                        .durationSec(600)
                        .powerPctFtpLow(40)
                        .powerPctFtpHigh(65)
                        .build()
        ));

        String xml = new String(ZwoEncoder.encode(template), StandardCharsets.UTF_8);

        assertThat(xml).contains("<Warmup");
        assertThat(xml).contains("Duration=\"600\"");
        assertThat(xml).contains("PowerLow=\"0.40\"");
        assertThat(xml).contains("PowerHigh=\"0.65\"");
    }

    @Test
    void encodesIntervalStepsCorrectly() {
        WorkoutTemplate template = buildTemplate("Intervals", List.of(
                WorkoutStep.builder()
                        .type("interval")
                        .repeat(5)
                        .onDurationSec(240)
                        .onPowerPctFtpLow(110)
                        .onPowerPctFtpHigh(120)
                        .offDurationSec(120)
                        .offPowerPctFtpLow(40)
                        .offPowerPctFtpHigh(50)
                        .build()
        ));

        String xml = new String(ZwoEncoder.encode(template), StandardCharsets.UTF_8);

        assertThat(xml).contains("<IntervalsT");
        assertThat(xml).contains("Repeat=\"5\"");
        assertThat(xml).contains("OnDuration=\"240\"");
        assertThat(xml).contains("OnPower=\"1.20\"");
        assertThat(xml).contains("OffDuration=\"120\"");
        assertThat(xml).contains("OffPower=\"0.50\"");
    }

    @Test
    void encodesCooldownStepCorrectly() {
        WorkoutTemplate template = buildTemplate("Cooldown Only", List.of(
                WorkoutStep.builder()
                        .type("cooldown")
                        .durationSec(300)
                        .powerPctFtpLow(30)
                        .powerPctFtpHigh(55)
                        .build()
        ));

        String xml = new String(ZwoEncoder.encode(template), StandardCharsets.UTF_8);

        assertThat(xml).contains("<Cooldown");
        assertThat(xml).contains("Duration=\"300\"");
        assertThat(xml).contains("PowerLow=\"0.30\"");
        assertThat(xml).contains("PowerHigh=\"0.55\"");
    }

    @Test
    void encodesSteadyStateStepCorrectly() {
        WorkoutTemplate template = buildTemplate("Steady", List.of(
                WorkoutStep.builder()
                        .type("steady")
                        .durationSec(1200)
                        .powerPctFtpLow(88)
                        .powerPctFtpHigh(93)
                        .build()
        ));

        String xml = new String(ZwoEncoder.encode(template), StandardCharsets.UTF_8);

        assertThat(xml).contains("<SteadyState");
        assertThat(xml).contains("Duration=\"1200\"");
        assertThat(xml).contains("Power=\"0.93\"");
    }

    @Test
    void fullWorkoutProducesValidXml() {
        WorkoutTemplate template = buildTemplate("Sweet Spot 2×20", List.of(
                WorkoutStep.builder().type("warmup").durationSec(600).powerPctFtpLow(50).powerPctFtpHigh(65).build(),
                WorkoutStep.builder().type("interval").repeat(2).onDurationSec(1200).onPowerPctFtpLow(88).onPowerPctFtpHigh(93).offDurationSec(300).offPowerPctFtpLow(40).offPowerPctFtpHigh(50).build(),
                WorkoutStep.builder().type("cooldown").durationSec(600).powerPctFtpLow(30).powerPctFtpHigh(55).build()
        ));

        String xml = new String(ZwoEncoder.encode(template), StandardCharsets.UTF_8);

        assertThat(xml).startsWith("<?xml");
        assertThat(xml).contains("<workout_file>");
        assertThat(xml).contains("</workout_file>");
        assertThat(xml).contains("<name>Sweet Spot 2×20</name>");
        assertThat(xml).contains("<sportType>bike</sportType>");
        assertThat(xml).contains("<workout>");
        assertThat(xml).contains("</workout>");
    }

    @Test
    void powerValuesAreFractionsOfFtp() {
        WorkoutTemplate template = buildTemplate("Power Test", List.of(
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(100).powerPctFtpHigh(100).build(),
                WorkoutStep.builder().type("steady").durationSec(600).powerPctFtpLow(150).powerPctFtpHigh(150).build()
        ));

        String xml = new String(ZwoEncoder.encode(template), StandardCharsets.UTF_8);

        assertThat(xml).contains("Power=\"1.00\"");
        assertThat(xml).contains("Power=\"1.50\"");
    }

    private WorkoutTemplate buildTemplate(String name, List<WorkoutStep> steps) {
        return WorkoutTemplate.builder()
                .id(UUID.randomUUID())
                .name(name)
                .category(WorkoutCategory.SWEET_SPOT)
                .description("Test workout")
                .targetTss(BigDecimal.valueOf(80))
                .targetDurationMin(60)
                .relativeEffort(7)
                .intensityFactor(BigDecimal.valueOf(0.88))
                .steps(steps)
                .createdBy("system")
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
