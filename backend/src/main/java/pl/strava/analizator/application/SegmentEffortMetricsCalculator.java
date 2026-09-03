package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.SegmentEffort;

@Component
public class SegmentEffortMetricsCalculator {

    public SegmentEffort enrich(Activity activity, SegmentEffort effort) {
        if (effort.getStartIndex() == null || effort.getEndIndex() == null) {
            return effort;
        }
        int start = Math.max(0, effort.getStartIndex());
        int end = Math.max(start, effort.getEndIndex());
        BigDecimal distance = difference(activity.getDistanceStream(), start, end);
        String routePolyline = null;
        if (activity.getLatStream() != null && activity.getLngStream() != null) {
            routePolyline = PolylineCodec.encodeLatLng(
                    activity.getLatStream(), activity.getLngStream(), start, end);
        }
        return effort.toBuilder()
                .distanceM(distance != null ? distance : effort.getDistanceM())
                .averagePowerW(averageShort(activity.getPowerStream(), start, end, effort.getAveragePowerW()))
                .averageHeartrate(averageShort(activity.getHeartrateStream(), start, end, effort.getAverageHeartrate()))
                .averageCadence(averageShort(activity.getCadenceStream(), start, end, effort.getAverageCadence()))
                .averageSpeedMs(averageDecimal(activity.getVelocityStream(), start, end, effort.getAverageSpeedMs()))
                .elevationGainM(elevationGain(activity.getAltitudeStream(), start, end, effort.getElevationGainM()))
                .build();
    }

    public String routePolyline(Activity activity, SegmentEffort effort) {
        if (effort.getStartIndex() == null || effort.getEndIndex() == null
                || activity.getLatStream() == null || activity.getLngStream() == null) {
            return null;
        }
        return PolylineCodec.encodeLatLng(activity.getLatStream(), activity.getLngStream(),
                effort.getStartIndex(), effort.getEndIndex());
    }

    private Short averageShort(int[] values, int start, int end, Short fallback) {
        if (values == null || start >= values.length) return fallback;
        int last = Math.min(end, values.length - 1);
        if (last < start) return fallback;
        long sum = 0;
        int count = 0;
        for (int i = start; i <= last; i++) {
            sum += values[i];
            count++;
        }
        return count == 0 ? fallback : (short) Math.round((double) sum / count);
    }

    private BigDecimal averageDecimal(double[] values, int start, int end, BigDecimal fallback) {
        if (values == null || start >= values.length) return fallback;
        int last = Math.min(end, values.length - 1);
        if (last < start) return fallback;
        double sum = 0;
        int count = 0;
        for (int i = start; i <= last; i++) {
            sum += values[i];
            count++;
        }
        return count == 0 ? fallback : BigDecimal.valueOf(sum / count).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal difference(double[] values, int start, int end) {
        if (values == null || start >= values.length || end >= values.length || end <= start) return null;
        double difference = values[end] - values[start];
        return difference >= 0 ? BigDecimal.valueOf(difference).setScale(2, RoundingMode.HALF_UP) : null;
    }

    private BigDecimal elevationGain(double[] values, int start, int end, BigDecimal fallback) {
        if (values == null || start >= values.length) return fallback;
        int last = Math.min(end, values.length - 1);
        double gain = 0;
        for (int i = start + 1; i <= last; i++) {
            gain += Math.max(0, values[i] - values[i - 1]);
        }
        return BigDecimal.valueOf(gain).setScale(2, RoundingMode.HALF_UP);
    }
}
