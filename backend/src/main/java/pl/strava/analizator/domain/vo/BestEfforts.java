package pl.strava.analizator.domain.vo;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Best power efforts by duration.
 * Key is duration in seconds, value is watts.
 * E.g. {5 → 850, 60 → 420, 300 → 310, 1200 → 280}
 */
@Getter
@Builder
@AllArgsConstructor
public class BestEfforts {

    private Map<Integer, Double> efforts;

    public Double getEffort(int durationSeconds) {
        return efforts != null ? efforts.get(durationSeconds) : null;
    }
}
