package pl.strava.analizator.infrastructure.export;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;

/**
 * Encodes a workout template as Zwift .zwo XML format.
 * ZWO is widely supported by Zwift, TrainerRoad, Wahoo SYSTM, and other training platforms.
 */
public final class ZwoEncoder {

    private static final int DEFAULT_DURATION = 300;
    private static final int DEFAULT_POWER_LOW = 50;
    private static final int DEFAULT_POWER_HIGH = 75;
    private static final int DEFAULT_REPEAT = 1;

    private ZwoEncoder() {
    }

    public static byte[] encode(WorkoutTemplate template) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<workout_file>\n");
        sb.append("    <author>StravaAnalizator</author>\n");
        sb.append("    <name>").append(escapeXml(template.getName())).append("</name>\n");
        sb.append("    <description>").append(escapeXml(safeString(template.getDescription()))).append("</description>\n");
        sb.append("    <sportType>bike</sportType>\n");
        sb.append("    <workout>\n");

        for (WorkoutStep step : safeSteps(template.getSteps())) {
            encodeStep(sb, step);
        }

        sb.append("    </workout>\n");
        sb.append("</workout_file>\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void encodeStep(StringBuilder sb, WorkoutStep step) {
        String type = step.getType() != null ? step.getType().toLowerCase(Locale.ROOT) : "steady";
        switch (type) {
            case "warmup" -> encodeWarmup(sb, step);
            case "cooldown" -> encodeCooldown(sb, step);
            case "interval" -> encodeInterval(sb, step);
            case "rest" -> encodeRest(sb, step);
            default -> encodeSteadyState(sb, step);
        }
    }

    private static void encodeWarmup(StringBuilder sb, WorkoutStep step) {
        int duration = safeInt(step.getDurationSec(), DEFAULT_DURATION);
        double powerLow = pctToFraction(safeInt(step.getPowerPctFtpLow(), DEFAULT_POWER_LOW));
        double powerHigh = pctToFraction(safeInt(step.getPowerPctFtpHigh(), DEFAULT_POWER_HIGH));
        sb.append(String.format(Locale.US,
                "        <Warmup Duration=\"%d\" PowerLow=\"%.2f\" PowerHigh=\"%.2f\" />\n",
                duration, powerLow, powerHigh));
    }

    private static void encodeCooldown(StringBuilder sb, WorkoutStep step) {
        int duration = safeInt(step.getDurationSec(), DEFAULT_DURATION);
        double powerLow = pctToFraction(safeInt(step.getPowerPctFtpLow(), 30));
        double powerHigh = pctToFraction(safeInt(step.getPowerPctFtpHigh(), 55));
        sb.append(String.format(Locale.US,
                "        <Cooldown Duration=\"%d\" PowerLow=\"%.2f\" PowerHigh=\"%.2f\" />\n",
                duration, powerLow, powerHigh));
    }

    private static void encodeSteadyState(StringBuilder sb, WorkoutStep step) {
        int duration = safeInt(step.getDurationSec(), DEFAULT_DURATION);
        double power = pctToFraction(safeInt(step.getPowerPctFtpHigh(), DEFAULT_POWER_HIGH));
        sb.append(String.format(Locale.US,
                "        <SteadyState Duration=\"%d\" Power=\"%.2f\" />\n",
                duration, power));
    }

    private static void encodeInterval(StringBuilder sb, WorkoutStep step) {
        int repeat = safeInt(step.getRepeat(), DEFAULT_REPEAT);
        int onDuration = safeInt(step.getOnDurationSec(), DEFAULT_DURATION);
        int offDuration = safeInt(step.getOffDurationSec(), DEFAULT_DURATION);
        double onPower = pctToFraction(safeInt(step.getOnPowerPctFtpHigh(), 100));
        double offPower = pctToFraction(safeInt(step.getOffPowerPctFtpHigh(), 50));
        sb.append(String.format(Locale.US,
                "        <IntervalsT Repeat=\"%d\" OnDuration=\"%d\" OffDuration=\"%d\" OnPower=\"%.2f\" OffPower=\"%.2f\" />\n",
                repeat, onDuration, offDuration, onPower, offPower));
    }

    private static void encodeRest(StringBuilder sb, WorkoutStep step) {
        int duration = safeInt(step.getDurationSec(), DEFAULT_DURATION);
        double power = pctToFraction(safeInt(step.getPowerPctFtpHigh(), 40));
        sb.append(String.format(Locale.US,
                "        <SteadyState Duration=\"%d\" Power=\"%.2f\" />\n",
                duration, power));
    }

    private static double pctToFraction(int pct) {
        return pct / 100.0;
    }

    private static int safeInt(Integer value, int fallback) {
        return value != null ? value : fallback;
    }

    private static String safeString(String value) {
        return value != null ? value : "";
    }

    private static List<WorkoutStep> safeSteps(List<WorkoutStep> steps) {
        return steps != null ? steps : List.of();
    }

    private static String escapeXml(String text) {
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
