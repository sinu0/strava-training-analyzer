package pl.strava.analizator.domain.vo;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Time spent in each training zone for power and/or HR.
 * Keys are zone labels (e.g. "Z1", "Z2"), values are seconds.
 */
@Getter
@Builder
@AllArgsConstructor
public class TimeInZones {

    private Map<String, Integer> powerZoneSeconds;
    private Map<String, Integer> hrZoneSeconds;

    public int totalPowerSeconds() {
        return powerZoneSeconds == null ? 0 : powerZoneSeconds.values().stream().mapToInt(Integer::intValue).sum();
    }

    public int totalHrSeconds() {
        return hrZoneSeconds == null ? 0 : hrZoneSeconds.values().stream().mapToInt(Integer::intValue).sum();
    }
}
