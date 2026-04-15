package pl.strava.analizator.application;

import pl.strava.analizator.domain.model.HeatmapPoint;
import pl.strava.analizator.domain.model.HeatmapSegment;

import java.util.*;

/**
 * Density surface built from heatmap segments.
 * GradientAt: returns vector pulling toward the nearest high-density segment.
 * ValueAt: returns normalized density at a point (Gaussian-weighted sum of nearby segment counts).
 */
public class HeatmapSegmentSurface implements SlideAlgorithm.DensitySurface {

    private static final double SEARCH_RADIUS = 0.0009;
    private static final double SIGMA = 0.00045;
    private static final double TWO_SIGMA_SQ = 2 * SIGMA * SIGMA;
    private static final double GRID_CELL = SEARCH_RADIUS;

    private final int maxCount;
    private final Map<Long, List<HeatmapSegment>> spatialGrid;

    public HeatmapSegmentSurface(List<HeatmapSegment> segments, int maxCount) {
        this.maxCount = Math.max(1, maxCount);
        this.spatialGrid = buildGrid(segments);
    }

    @Override
    public HeatmapPoint gradientAt(HeatmapPoint p) {
        double gradLat = 0, gradLon = 0;
        double totalWeight = 0;

        for (HeatmapSegment seg : nearbySegments(p)) {
            HeatmapPoint closest = closestPointOnSegment(p, seg);
            HeatmapPoint diff = closest.subtract(p);
            double dist = diff.magnitude();
            if (dist < 1e-12) continue;

            double weight = seg.getTraversalCount() * Math.exp(-dist * dist / TWO_SIGMA_SQ);
            gradLat += diff.lat() / dist * weight;
            gradLon += diff.lon() / dist * weight;
            totalWeight += weight;
        }
        if (totalWeight < 1e-12) return HeatmapPoint.zero();
        return new HeatmapPoint(gradLat / totalWeight, gradLon / totalWeight);
    }

    @Override
    public double valueAt(HeatmapPoint p) {
        double density = 0;
        for (HeatmapSegment seg : nearbySegments(p)) {
            HeatmapPoint closest = closestPointOnSegment(p, seg);
            double dist = p.subtract(closest).magnitude();
            double normalizedCount = (double) seg.getTraversalCount() / maxCount;
            density += normalizedCount * Math.exp(-dist * dist / TWO_SIGMA_SQ);
        }
        return Math.min(1.0, density);
    }

    private HeatmapPoint closestPointOnSegment(HeatmapPoint p, HeatmapSegment seg) {
        HeatmapPoint a = new HeatmapPoint(seg.getLat1(), seg.getLon1());
        HeatmapPoint b = new HeatmapPoint(seg.getLat2(), seg.getLon2());
        HeatmapPoint ab = b.subtract(a);
        double lenSq = ab.dot(ab);
        if (lenSq < 1e-24) return a;
        double t = Math.max(0, Math.min(1, p.subtract(a).dot(ab) / lenSq));
        return a.add(ab.scale(t));
    }

    private List<HeatmapSegment> nearbySegments(HeatmapPoint p) {
        Set<HeatmapSegment> result = new HashSet<>();
        long minGridLat = gridKey(p.lat() - SEARCH_RADIUS);
        long maxGridLat = gridKey(p.lat() + SEARCH_RADIUS);
        long minGridLon = gridKey(p.lon() - SEARCH_RADIUS);
        long maxGridLon = gridKey(p.lon() + SEARCH_RADIUS);

        for (long gLat = minGridLat; gLat <= maxGridLat; gLat++) {
            for (long gLon = minGridLon; gLon <= maxGridLon; gLon++) {
                List<HeatmapSegment> cell = spatialGrid.get(gLat * 1_000_000L + gLon);
                if (cell != null) result.addAll(cell);
            }
        }
        return new ArrayList<>(result);
    }

    private static Map<Long, List<HeatmapSegment>> buildGrid(List<HeatmapSegment> segments) {
        Map<Long, List<HeatmapSegment>> grid = new HashMap<>();
        for (HeatmapSegment seg : segments) {
            for (double lat : new double[]{seg.getLat1(), seg.getLat2()}) {
                for (double lon : new double[]{seg.getLon1(), seg.getLon2()}) {
                    long key = gridKey(lat) * 1_000_000L + gridKey(lon);
                    grid.computeIfAbsent(key, k -> new ArrayList<>()).add(seg);
                }
            }
        }
        return grid;
    }

    private static long gridKey(double coord) {
        return (long) Math.floor(coord / GRID_CELL);
    }
}
