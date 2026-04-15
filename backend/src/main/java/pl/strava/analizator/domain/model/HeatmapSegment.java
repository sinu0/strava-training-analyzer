package pl.strava.analizator.domain.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HeatmapSegment {
    private Long id;
    private double lat1;
    private double lon1;
    private double lat2;
    private double lon2;
    private String gridKeyA;
    private String gridKeyB;
    private int traversalCount;
}
