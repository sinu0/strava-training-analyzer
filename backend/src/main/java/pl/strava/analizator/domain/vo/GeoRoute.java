package pl.strava.analizator.domain.vo;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Geographic route — list of [lat, lng] coordinates.
 */
@Getter
@Builder
@AllArgsConstructor
public class GeoRoute {

    private List<double[]> coordinates;
    private String summaryPolyline;

    public boolean isEmpty() {
        return coordinates == null || coordinates.isEmpty();
    }

    public int pointCount() {
        return coordinates == null ? 0 : coordinates.size();
    }
}
