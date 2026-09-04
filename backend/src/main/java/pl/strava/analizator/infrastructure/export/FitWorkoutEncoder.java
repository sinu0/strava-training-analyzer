package pl.strava.analizator.infrastructure.export;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import com.garmin.fit.BufferEncoder;
import com.garmin.fit.DateTime;
import com.garmin.fit.File;
import com.garmin.fit.FileIdMesg;
import com.garmin.fit.Fit;
import com.garmin.fit.Intensity;
import com.garmin.fit.Manufacturer;
import com.garmin.fit.Sport;
import com.garmin.fit.SubSport;
import com.garmin.fit.WktStepDuration;
import com.garmin.fit.WktStepTarget;
import com.garmin.fit.WorkoutMesg;
import com.garmin.fit.WorkoutStepMesg;

import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;

/** Encodes workout files through Garmin's official FIT SDK and current profile. */
public final class FitWorkoutEncoder {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int DEFAULT_FTP = 200;
    private static final int MAX_WORKOUT_NAME_BYTES = 40;
    private static final int MAX_STEP_NAME_BYTES = 40;
    private static final int MAX_NOTES_BYTES = 200;

    private FitWorkoutEncoder() {
    }

    public static byte[] encode(WorkoutTemplate template) {
        return encode(template, DEFAULT_FTP);
    }

    public static byte[] encode(WorkoutTemplate template, int ftpWatts) {
        List<FitStep> steps = expandSteps(template.getSteps());
        if (steps.isEmpty()) {
            throw new IllegalArgumentException("FIT workout requires at least one step");
        }

        FileIdMesg fileId = new FileIdMesg();
        fileId.setType(File.WORKOUT);
        fileId.setManufacturer((int) Manufacturer.DEVELOPMENT);
        fileId.setProduct(0);
        fileId.setTimeCreated(new DateTime(Date.from(Instant.now())));
        fileId.setSerialNumber(Integer.toUnsignedLong(nonZeroRandomInt()));

        WorkoutMesg workout = new WorkoutMesg();
        workout.setWktName(truncateUtf8(template.getName() != null ? template.getName() : "Workout",
                MAX_WORKOUT_NAME_BYTES));
        workout.setSport(Sport.CYCLING);
        workout.setSubSport(SubSport.INVALID);
        workout.setNumValidSteps(steps.size());

        BufferEncoder encoder = new BufferEncoder(Fit.ProtocolVersion.V1_0);
        encoder.write(fileId);
        encoder.write(workout);
        for (int index = 0; index < steps.size(); index++) {
            encoder.write(toMesg(index, steps.get(index), ftpWatts));
        }
        return encoder.close();
    }

    static List<FitStep> expandSteps(List<WorkoutStep> source) {
        List<FitStep> result = new ArrayList<>();
        if (source == null) {
            return result;
        }
        for (WorkoutStep step : source) {
            String type = step.getType() != null ? step.getType().toLowerCase(Locale.ROOT) : "steady";
            if ("interval".equals(type)) {
                expandInterval(result, step);
                continue;
            }
            result.add(buildStep(
                    step.getDurationSec(), step.getDurationType(),
                    step.getPowerPctFtpLow(), step.getPowerPctFtpHigh(),
                    step.getHeartRateBpmLow(), step.getHeartRateBpmHigh(),
                    step.getCadenceRpmLow(), step.getCadenceRpmHigh(),
                    intensity(type), step.getName(), step.getInstructions(),
                    "freeride".equals(type) || "free_ride".equals(type)));
        }
        return result;
    }

    private static void expandInterval(List<FitStep> result, WorkoutStep step) {
        int firstStepIndex = result.size();
        int repeat = positiveOr(step.getRepeat(), 1);
        result.add(buildStep(
                step.getOnDurationSec(), "TIME",
                step.getOnPowerPctFtpLow(), step.getOnPowerPctFtpHigh(),
                step.getOnHeartRateBpmLow(), step.getOnHeartRateBpmHigh(),
                step.getOnCadenceRpmLow(), step.getOnCadenceRpmHigh(),
                Intensity.ACTIVE, step.getName() != null ? step.getName() : "Interwał",
                step.getInstructions(), false));
        result.add(buildStep(
                step.getOffDurationSec(), "TIME",
                step.getOffPowerPctFtpLow(), step.getOffPowerPctFtpHigh(),
                step.getOffHeartRateBpmLow(), step.getOffHeartRateBpmHigh(),
                step.getOffCadenceRpmLow(), step.getOffCadenceRpmHigh(),
                Intensity.REST, "Odpoczynek", null, false));
        if (repeat > 1) {
            result.add(new FitStep(
                    (byte) WktStepDuration.REPEAT_UNTIL_STEPS_CMPLT.getValue(), firstStepIndex,
                    (byte) WktStepTarget.OPEN.getValue(), repeat, 0, 0,
                    (byte) Intensity.ACTIVE.getValue(), "Powtórz ×" + repeat, null,
                    null, null, null, null));
        }
    }

    private static FitStep buildStep(
            Integer durationSec, String durationType,
            Integer powerLow, Integer powerHigh,
            Integer heartRateLow, Integer heartRateHigh,
            Integer cadenceLow, Integer cadenceHigh,
            Intensity intensity, String name, String instructions, boolean forceOpenTarget) {
        boolean openDuration = durationSec == null
                || "LAP_BUTTON".equalsIgnoreCase(durationType)
                || "OPEN".equalsIgnoreCase(durationType);
        byte fitDurationType = (byte) (openDuration
                ? WktStepDuration.OPEN.getValue() : WktStepDuration.TIME.getValue());
        long durationValue = openDuration ? 0 : Math.max(0, durationSec) * 1_000L;

        WktStepTarget target = WktStepTarget.OPEN;
        long low = 0;
        long high = 0;
        Short secondaryTarget = null;
        Long secondaryLow = null;
        Long secondaryHigh = null;
        if (!forceOpenTarget && (powerLow != null || powerHigh != null)) {
            target = WktStepTarget.POWER;
            low = longOr(powerLow, powerHigh);
            high = longOr(powerHigh, powerLow);
            if (cadenceLow != null || cadenceHigh != null) {
                secondaryTarget = WktStepTarget.CADENCE.getValue();
                secondaryLow = longOr(cadenceLow, cadenceHigh);
                secondaryHigh = longOr(cadenceHigh, cadenceLow);
            } else if (heartRateLow != null || heartRateHigh != null) {
                secondaryTarget = WktStepTarget.HEART_RATE.getValue();
                secondaryLow = encodeHeartRate(heartRateLow, heartRateHigh);
                secondaryHigh = encodeHeartRate(heartRateHigh, heartRateLow);
            }
        } else if (!forceOpenTarget && (heartRateLow != null || heartRateHigh != null)) {
            target = WktStepTarget.HEART_RATE;
            low = encodeHeartRate(heartRateLow, heartRateHigh);
            high = encodeHeartRate(heartRateHigh, heartRateLow);
            if (cadenceLow != null || cadenceHigh != null) {
                secondaryTarget = WktStepTarget.CADENCE.getValue();
                secondaryLow = longOr(cadenceLow, cadenceHigh);
                secondaryHigh = longOr(cadenceHigh, cadenceLow);
            }
        } else if (!forceOpenTarget && (cadenceLow != null || cadenceHigh != null)) {
            target = WktStepTarget.CADENCE;
            low = longOr(cadenceLow, cadenceHigh);
            high = longOr(cadenceHigh, cadenceLow);
        }

        return new FitStep(fitDurationType, durationValue, (byte) target.getValue(), 0, low, high,
                (byte) intensity.getValue(), name, instructions, secondaryTarget, secondaryLow, secondaryHigh,
                target == WktStepTarget.POWER ? new int[]{(int) low, (int) high} : null);
    }

    private static WorkoutStepMesg toMesg(int index, FitStep step, int ftpWatts) {
        WorkoutStepMesg message = new WorkoutStepMesg();
        message.setMessageIndex(index);
        message.setDurationType(WktStepDuration.getByValue((short) Byte.toUnsignedInt(step.durationType())));
        if (step.durationType() != (byte) WktStepDuration.OPEN.getValue()) {
            message.setDurationValue(step.durationValue());
        }
        message.setTargetType(WktStepTarget.getByValue((short) Byte.toUnsignedInt(step.targetType())));
        message.setTargetValue(step.targetValue());
        if (step.customTargetLow() != 0 || step.customTargetHigh() != 0) {
            message.setCustomTargetValueLow(step.customTargetLow());
            message.setCustomTargetValueHigh(step.customTargetHigh());
        }
        if (step.secondaryTargetType() != null) {
            message.setSecondaryTargetType(WktStepTarget.getByValue(step.secondaryTargetType()));
            message.setSecondaryTargetValue(0L);
            message.setSecondaryCustomTargetValueLow(step.secondaryTargetLow());
            message.setSecondaryCustomTargetValueHigh(step.secondaryTargetHigh());
        }
        message.setIntensity(Intensity.getByValue((short) Byte.toUnsignedInt(step.intensity())));
        if (step.name() != null) {
            message.setWktStepName(truncateUtf8(step.name(), MAX_STEP_NAME_BYTES));
        }
        String notes = buildNotes(step, ftpWatts);
        if (!notes.isBlank()) {
            message.setNotes(truncateUtf8(notes, MAX_NOTES_BYTES));
        }
        return message;
    }

    private static String buildNotes(FitStep step, int ftpWatts) {
        String instructions = step.instructions() != null ? step.instructions().trim() : "";
        if (step.powerRangePct() == null || ftpWatts <= 0) {
            return instructions;
        }
        int lowWatts = Math.round(ftpWatts * step.powerRangePct()[0] / 100f);
        int highWatts = Math.round(ftpWatts * step.powerRangePct()[1] / 100f);
        String target = "%d–%d%% FTP (%d W–%d W; FTP %d W)".formatted(
                step.powerRangePct()[0], step.powerRangePct()[1], lowWatts, highWatts, ftpWatts);
        return instructions.isBlank() ? target : instructions + " · " + target;
    }

    private static Intensity intensity(String type) {
        return switch (type) {
            case "warmup" -> Intensity.WARMUP;
            case "cooldown" -> Intensity.COOLDOWN;
            case "rest", "recovery" -> Intensity.REST;
            default -> Intensity.ACTIVE;
        };
    }

    private static long encodeHeartRate(Integer primary, Integer fallback) {
        return 100L + longOr(primary, fallback);
    }

    private static long longOr(Integer primary, Integer fallback) {
        return primary != null ? primary.longValue() : fallback != null ? fallback.longValue() : 0L;
    }

    private static int positiveOr(Integer value, int fallback) {
        return value != null && value > 0 ? value : fallback;
    }

    private static int nonZeroRandomInt() {
        int value;
        do {
            value = RANDOM.nextInt();
        } while (value == 0);
        return value;
    }

    private static String truncateUtf8(String text, int maxBytes) {
        if (text == null) {
            return null;
        }
        StringBuilder result = new StringBuilder();
        for (int offset = 0; offset < text.length();) {
            int codePoint = text.codePointAt(offset);
            String character = Character.toString(codePoint);
            if ((result.toString() + character).getBytes(StandardCharsets.UTF_8).length > maxBytes) {
                break;
            }
            result.append(character);
            offset += Character.charCount(codePoint);
        }
        return result.toString();
    }

    static int crc16(byte[] data, int offset, int length) {
        int crc = 0;
        for (int index = offset; index < offset + length; index++) {
            crc ^= data[index] & 0xFF;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 1) != 0 ? (crc >>> 1) ^ 0xA001 : crc >>> 1;
            }
        }
        return crc & 0xFFFF;
    }

    record FitStep(byte durationType, long durationValue, byte targetType, long targetValue,
                   long customTargetLow, long customTargetHigh, byte intensity,
                   String name, String instructions, Short secondaryTargetType,
                   Long secondaryTargetLow, Long secondaryTargetHigh, int[] powerRangePct) {
    }
}
