package pl.strava.analizator.infrastructure.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;

/**
 * Encodes a workout template as a Garmin FIT binary workout file.
 * Implements a minimal FIT encoder supporting File ID, Workout, and Workout Step messages.
 */
public final class FitWorkoutEncoder {

    private static final byte HEADER_SIZE = 14;
    private static final byte PROTOCOL_VERSION = 0x20;
    private static final short PROFILE_VERSION = 2132;

    // FIT base types
    private static final byte TYPE_ENUM = 0x00;
    private static final byte TYPE_UINT16 = (byte) 0x84;
    private static final byte TYPE_UINT32 = (byte) 0x86;
    private static final byte TYPE_STRING = 0x07;

    // Global message numbers
    private static final short MESG_FILE_ID = 0;
    private static final short MESG_WORKOUT = 26;
    private static final short MESG_WORKOUT_STEP = 27;

    // Local message type slots
    private static final byte LOCAL_FILE_ID = 0;
    private static final byte LOCAL_WORKOUT = 1;
    private static final byte LOCAL_WORKOUT_STEP = 2;

    // FIT power %FTP offset
    private static final int FTP_PERCENT_OFFSET = 1000;

    private FitWorkoutEncoder() {
    }

    public static byte[] encode(WorkoutTemplate template) {
        try {
            ByteArrayOutputStream data = new ByteArrayOutputStream();

            writeFileIdMessage(data);

            List<FitStep> fitSteps = expandSteps(template.getSteps());

            byte[] nameBytes = fitNameBytes(template.getName());
            writeWorkoutMessage(data, nameBytes, fitSteps.size());

            writeWorkoutStepDefinition(data);
            for (int i = 0; i < fitSteps.size(); i++) {
                writeWorkoutStepData(data, i, fitSteps.get(i));
            }

            byte[] dataBytes = data.toByteArray();
            return buildFile(dataBytes);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to encode FIT workout", e);
        }
    }

    // --- File ID ---

    private static void writeFileIdMessage(ByteArrayOutputStream out) throws IOException {
        // Definition: 4 fields
        writeDefinitionHeader(out, LOCAL_FILE_ID, MESG_FILE_ID, new FieldDef[]{
                new FieldDef(0, 1, TYPE_ENUM),      // type
                new FieldDef(1, 2, TYPE_UINT16),     // manufacturer
                new FieldDef(2, 2, TYPE_UINT16),     // product
                new FieldDef(3, 4, TYPE_UINT32),     // serial_number
        });

        // Data
        writeDataHeader(out, LOCAL_FILE_ID);
        out.write(5);                                   // type = WORKOUT
        writeUint16(out, 0xFFFF);                        // manufacturer = INVALID (unknown third-party)
        writeUint16(out, 0xFFFF);                        // product = INVALID
        writeUint32(out, 0);                             // serial_number
    }

    // --- Workout ---

    private static void writeWorkoutMessage(ByteArrayOutputStream out, byte[] nameBytes, int numSteps) throws IOException {
        writeDefinitionHeader(out, LOCAL_WORKOUT, MESG_WORKOUT, new FieldDef[]{
                new FieldDef(4, 1, TYPE_ENUM),                // sport
                new FieldDef(6, 2, TYPE_UINT16),              // num_valid_steps
                new FieldDef(8, (byte) nameBytes.length, TYPE_STRING), // wkt_name
        });

        writeDataHeader(out, LOCAL_WORKOUT);
        out.write(2);                                    // sport = CYCLING
        writeUint16(out, numSteps);
        out.write(nameBytes);
    }

    // --- Workout Step ---

    private static void writeWorkoutStepDefinition(ByteArrayOutputStream out) throws IOException {
        writeDefinitionHeader(out, LOCAL_WORKOUT_STEP, MESG_WORKOUT_STEP, new FieldDef[]{
                new FieldDef((byte) 254, 2, TYPE_UINT16),  // message_index
                new FieldDef(1, 1, TYPE_ENUM),              // duration_type
                new FieldDef(2, 4, TYPE_UINT32),            // duration_value
                new FieldDef(3, 1, TYPE_ENUM),              // target_type
                new FieldDef(4, 4, TYPE_UINT32),            // target_value
                new FieldDef(5, 4, TYPE_UINT32),            // custom_target_value_low
                new FieldDef(6, 4, TYPE_UINT32),            // custom_target_value_high
                new FieldDef(7, 1, TYPE_ENUM),              // intensity
        });
    }

    private static void writeWorkoutStepData(ByteArrayOutputStream out, int index, FitStep step)
            throws IOException {
        writeDataHeader(out, LOCAL_WORKOUT_STEP);
        writeUint16(out, index);                          // message_index
        out.write(step.durationType);                     // duration_type
        writeUint32(out, step.durationValue);             // duration_value
        out.write(step.targetType);                       // target_type
        writeUint32(out, step.targetValue);               // target_value
        writeUint32(out, step.customTargetLow);           // custom_target_value_low
        writeUint32(out, step.customTargetHigh);          // custom_target_value_high
        out.write(step.intensity);                        // intensity
    }

    // --- Step expansion ---

    static List<FitStep> expandSteps(List<WorkoutStep> steps) {
        List<FitStep> result = new ArrayList<>();
        if (steps == null) return result;

        for (WorkoutStep step : steps) {
            String type = step.getType() != null ? step.getType().toLowerCase(Locale.ROOT) : "steady";
            switch (type) {
                case "warmup" -> result.add(buildPowerStep(step.getDurationSec(), step.getPowerPctFtpLow(), step.getPowerPctFtpHigh(), INTENSITY_WARMUP));
                case "cooldown" -> result.add(buildPowerStep(step.getDurationSec(), step.getPowerPctFtpLow(), step.getPowerPctFtpHigh(), INTENSITY_COOLDOWN));
                case "rest" -> result.add(buildPowerStep(step.getDurationSec(), step.getPowerPctFtpLow(), step.getPowerPctFtpHigh(), INTENSITY_REST));
                case "interval" -> expandInterval(result, step);
                default -> result.add(buildPowerStep(step.getDurationSec(), step.getPowerPctFtpLow(), step.getPowerPctFtpHigh(), INTENSITY_ACTIVE));
            }
        }
        return result;
    }

    private static void expandInterval(List<FitStep> result, WorkoutStep step) {
        int repeat = step.getRepeat() != null && step.getRepeat() > 0 ? step.getRepeat() : 1;
        int firstStepIndex = result.size();

        result.add(buildPowerStep(step.getOnDurationSec(), step.getOnPowerPctFtpLow(), step.getOnPowerPctFtpHigh(), INTENSITY_ACTIVE));
        result.add(buildPowerStep(step.getOffDurationSec(), step.getOffPowerPctFtpLow(), step.getOffPowerPctFtpHigh(), INTENSITY_REST));

        if (repeat > 1) {
            // REPEAT_UNTIL_STEPS_CMPLT: duration_value = repeat count, target_value = index of first step in group
            result.add(new FitStep(DURATION_REPEAT_UNTIL_STEPS_CMPLT, repeat, TARGET_OPEN, firstStepIndex, 0, 0, INTENSITY_ACTIVE));
        }
    }

    private static FitStep buildPowerStep(Integer durationSec, Integer powerPctLow, Integer powerPctHigh, byte intensity) {
        int durationMs = (durationSec != null ? durationSec : 300) * 1000;
        int low = (powerPctLow != null ? powerPctLow : 50) + FTP_PERCENT_OFFSET;
        int high = (powerPctHigh != null ? powerPctHigh : 75) + FTP_PERCENT_OFFSET;
        return new FitStep(DURATION_TIME, durationMs, TARGET_POWER, 0, low, high, intensity);
    }

    // --- Binary helpers ---

    private static void writeDefinitionHeader(ByteArrayOutputStream out, byte localType, short globalMesgNum,
                                               FieldDef[] fields) throws IOException {
        out.write(0x40 | (localType & 0x0F));  // record header: definition message
        out.write(0);                           // reserved
        out.write(0);                           // architecture: little-endian
        writeUint16(out, globalMesgNum);
        out.write(fields.length);
        for (FieldDef f : fields) {
            out.write(f.number & 0xFF);
            out.write(f.size & 0xFF);
            out.write(f.baseType & 0xFF);
        }
    }

    private static void writeDataHeader(ByteArrayOutputStream out, byte localType) {
        out.write(localType & 0x0F);  // record header: data message
    }

    private static void writeUint16(ByteArrayOutputStream out, int value) {
        out.write(value & 0xFF);
        out.write((value >> 8) & 0xFF);
    }

    private static void writeUint32(ByteArrayOutputStream out, long value) {
        out.write((int) (value & 0xFF));
        out.write((int) ((value >> 8) & 0xFF));
        out.write((int) ((value >> 16) & 0xFF));
        out.write((int) ((value >> 24) & 0xFF));
    }

    private static byte[] fitNameBytes(String name) {
        String trimmed = name != null ? name : "Workout";
        if (trimmed.length() > 39) {
            trimmed = trimmed.substring(0, 39);
        }
        return (trimmed + "\0").getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] buildFile(byte[] dataBytes) throws IOException {
        ByteArrayOutputStream file = new ByteArrayOutputStream();

        // Header (14 bytes)
        ByteBuffer header = ByteBuffer.allocate(12).order(ByteOrder.LITTLE_ENDIAN);
        header.put(HEADER_SIZE);
        header.put(PROTOCOL_VERSION);
        header.putShort(PROFILE_VERSION);
        header.putInt(dataBytes.length);
        header.put(".FIT".getBytes(StandardCharsets.US_ASCII));

        byte[] headerBytes = header.array();
        int headerCrc = crc16(headerBytes, 0, headerBytes.length);
        file.write(headerBytes);
        writeUint16(file, headerCrc);

        // Data records
        file.write(dataBytes);

        // File CRC (over header + data, not including CRC itself)
        byte[] allBytes = file.toByteArray();
        int fileCrc = crc16(allBytes, 0, allBytes.length);
        writeUint16(file, fileCrc);

        return file.toByteArray();
    }

    static int crc16(byte[] data, int offset, int length) {
        int crc = 0;
        for (int i = offset; i < offset + length; i++) {
            crc ^= (data[i] & 0xFF);
            for (int bit = 0; bit < 8; bit++) {
                if ((crc & 1) != 0) {
                    crc = (crc >>> 1) ^ 0xA001;
                } else {
                    crc >>>= 1;
                }
            }
        }
        return crc & 0xFFFF;
    }

    // --- Internal types ---

    private static final byte DURATION_TIME = 0;
    private static final byte DURATION_REPEAT_UNTIL_STEPS_CMPLT = 6;
    private static final byte TARGET_OPEN = 0;
    private static final byte TARGET_POWER = 4;
    private static final byte INTENSITY_ACTIVE = 0;
    private static final byte INTENSITY_REST = 1;
    private static final byte INTENSITY_WARMUP = 2;
    private static final byte INTENSITY_COOLDOWN = 3;

    record FitStep(byte durationType, long durationValue, byte targetType, long targetValue,
                   long customTargetLow, long customTargetHigh, byte intensity) {
    }

    private record FieldDef(int number, int size, byte baseType) {
    }
}
