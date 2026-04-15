package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class RoutePreview {
    private List<double[]> polyline;
    private BigDecimal distanceM;
    private BigDecimal elevationGainM;
    private Integer estimatedTimeSec;
    private Integer estimatedTss;
    private String provider;
    private String profile;
    private BigDecimal pavedDistanceM;
    private BigDecimal unpavedDistanceM;
    private BigDecimal cyclewayDistanceM;
    private BigDecimal quietDistanceM;
    private List<String> notices;
}
