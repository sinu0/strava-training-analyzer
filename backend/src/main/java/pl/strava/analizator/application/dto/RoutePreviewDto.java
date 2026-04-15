package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.util.List;

import pl.strava.analizator.domain.model.RoutePreview;

public record RoutePreviewDto(
        List<double[]> polyline,
        BigDecimal distanceM,
        BigDecimal elevationGainM,
        Integer estimatedTimeSec,
        Integer estimatedTss,
        String provider,
        String profile,
        BigDecimal pavedDistanceM,
        BigDecimal unpavedDistanceM,
        BigDecimal cyclewayDistanceM,
        BigDecimal quietDistanceM,
        List<String> notices
) {
    public static RoutePreviewDto from(RoutePreview preview) {
        return new RoutePreviewDto(
                preview.getPolyline(),
                preview.getDistanceM(),
                preview.getElevationGainM(),
                preview.getEstimatedTimeSec(),
                preview.getEstimatedTss(),
                preview.getProvider(),
                preview.getProfile(),
                preview.getPavedDistanceM(),
                preview.getUnpavedDistanceM(),
                preview.getCyclewayDistanceM(),
                preview.getQuietDistanceM(),
                preview.getNotices());
    }
}
