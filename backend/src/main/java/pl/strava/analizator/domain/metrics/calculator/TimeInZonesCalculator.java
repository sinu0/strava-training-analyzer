package pl.strava.analizator.domain.metrics.calculator;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.TrainingZone;
import pl.strava.analizator.domain.vo.TimeInZones;

/**
 * Calculates time spent in each training zone for power and/or HR streams.
 */
public class TimeInZonesCalculator implements ActivityMetricCalculator<TimeInZones> {

    @Override
    public String metricName() {
        return "time_in_zones";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData() || activity.hasHeartrateData();
    }

    @Override
    public TimeInZones calculate(Activity activity, AthleteProfile profile) {
        Map<String, Integer> powerZones = null;
        Map<String, Integer> hrZones = null;

        if (activity.hasPowerData()) {
            powerZones = calculateZoneSeconds(activity.getPowerStream());
        }
        if (activity.hasHeartrateData()) {
            hrZones = calculateZoneSeconds(activity.getHeartrateStream());
        }

        return TimeInZones.builder()
                .powerZoneSeconds(powerZones)
                .hrZoneSeconds(hrZones)
                .build();
    }

    /**
     * Distributes stream values into 7 zones based on percentage of max value.
     * Zone boundaries: Z1: 0-55%, Z2: 55-75%, Z3: 75-90%, Z4: 90-105%, Z5: 105-120%, Z6: 120-150%, Z7: >150%
     * For power these are % of FTP (Coggan), for HR % of max HR.
     * Using a simplified approach based on the stream values and 7 zone buckets.
     */
    private Map<String, Integer> calculateZoneSeconds(int[] stream) {
        Map<String, Integer> zones = new LinkedHashMap<>();
        for (int i = 1; i <= 7; i++) {
            zones.put("Z" + i, 0);
        }

        for (int value : stream) {
            String zone = classifyToZone(value, stream);
            zones.merge(zone, 1, Integer::sum);
        }
        return zones;
    }

    private String classifyToZone(int value, int[] stream) {
        // Find max value for relative zone classification
        int max = 0;
        for (int v : stream) {
            if (v > max) max = v;
        }
        if (max == 0) return "Z1";

        double pct = (double) value / max * 100;

        if (pct < 55) return "Z1";
        if (pct < 75) return "Z2";
        if (pct < 90) return "Z3";
        if (pct < 105) return "Z4";
        if (pct < 120) return "Z5";
        if (pct < 150) return "Z6";
        return "Z7";
    }

    /**
     * Calculate time in zones using predefined zone boundaries (TrainingZone objects).
     */
    public Map<String, Integer> calculateWithZones(int[] stream, List<TrainingZone> zones) {
        Map<String, Integer> result = new LinkedHashMap<>();
        for (TrainingZone zone : zones) {
            result.put(zone.getZoneName(), 0);
        }
        // Sort zones by zone number for proper classification
        List<TrainingZone> sorted = zones.stream()
                .sorted((a, b) -> Short.compare(a.getZoneNumber(), b.getZoneNumber()))
                .toList();

        for (int value : stream) {
            String zoneName = classifyToDefinedZone(value, sorted);
            result.merge(zoneName, 1, Integer::sum);
        }
        return result;
    }

    private String classifyToDefinedZone(int value, List<TrainingZone> sortedZones) {
        for (int i = sortedZones.size() - 1; i >= 0; i--) {
            TrainingZone zone = sortedZones.get(i);
            if (value >= zone.getMinValue()) {
                return zone.getZoneName();
            }
        }
        // Below minimum → first zone
        return sortedZones.getFirst().getZoneName();
    }
}
