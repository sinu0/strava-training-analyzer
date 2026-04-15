package pl.strava.analizator.application;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.HeatmapSegment;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class HeatmapSkeletonBuilder {

    private static final double MERGE_RADIUS = 0.00035;
    private static final double ANGLE_THRESHOLD_DEG = 30.0;
    private static final double GRID_CELL = MERGE_RADIUS;
    private static final double SNAP = 0.00027;

    public List<HeatmapSegment> buildSkeleton(List<HeatmapSegment> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }

        int n = raw.size();
        double[] midLats = new double[n];
        double[] midLons = new double[n];

        Map<Long, List<Integer>> index = new HashMap<>();
        for (int i = 0; i < n; i++) {
            HeatmapSegment s = raw.get(i);
            midLats[i] = (s.getLat1() + s.getLat2()) / 2.0;
            midLons[i] = (s.getLon1() + s.getLon2()) / 2.0;
            long key = latGrid(midLats[i]) * 1_000_000L + lonGrid(midLons[i]);
            index.computeIfAbsent(key, k -> new ArrayList<>()).add(i);
        }

        int[] parent = new int[n];
        int[] rank = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
        }

        for (int i = 0; i < n; i++) {
            long gLatMin = latGrid(midLats[i] - MERGE_RADIUS);
            long gLatMax = latGrid(midLats[i] + MERGE_RADIUS);
            long gLonMin = lonGrid(midLons[i] - MERGE_RADIUS);
            long gLonMax = lonGrid(midLons[i] + MERGE_RADIUS);

            for (long gLat = gLatMin; gLat <= gLatMax; gLat++) {
                for (long gLon = gLonMin; gLon <= gLonMax; gLon++) {
                    List<Integer> candidates = index.get(gLat * 1_000_000L + gLon);
                    if (candidates == null) continue;
                    for (int j : candidates) {
                        if (j <= i) continue;
                        double dLat = midLats[i] - midLats[j];
                        double dLon = midLons[i] - midLons[j];
                        double dist = Math.sqrt(dLat * dLat + dLon * dLon);
                        if (dist < MERGE_RADIUS && directionSimilar(raw.get(i), raw.get(j))) {
                            union(parent, rank, i, j);
                        }
                    }
                }
            }
        }

        Map<Integer, List<Integer>> groups = new HashMap<>();
        for (int i = 0; i < n; i++) {
            groups.computeIfAbsent(find(parent, i), k -> new ArrayList<>()).add(i);
        }

        List<HeatmapSegment> result = new ArrayList<>();
        for (List<Integer> group : groups.values()) {
            HeatmapSegment merged = buildRepresentative(raw, group);
            if (merged != null) {
                result.add(merged);
            }
        }

        log.debug("Skeleton: {} raw → {} merged segments", n, result.size());
        return result;
    }

    private HeatmapSegment buildRepresentative(List<HeatmapSegment> raw, List<Integer> group) {
        HeatmapSegment ref = raw.get(group.get(0));
        double refAngle = angle(ref);

        double wLat1 = 0, wLon1 = 0, wLat2 = 0, wLon2 = 0;
        int totalCount = 0;

        for (int idx : group) {
            HeatmapSegment s = raw.get(idx);
            double diff = angleDiffDeg(angle(s), refAngle);
            boolean flip = Math.abs(diff) > 90;

            double l1 = flip ? s.getLat2() : s.getLat1();
            double lo1 = flip ? s.getLon2() : s.getLon1();
            double l2 = flip ? s.getLat1() : s.getLat2();
            double lo2 = flip ? s.getLon1() : s.getLon2();

            int w = s.getTraversalCount();
            wLat1 += l1 * w;
            wLon1 += lo1 * w;
            wLat2 += l2 * w;
            wLon2 += lo2 * w;
            totalCount += w;
        }

        if (totalCount == 0) return null;

        double avgLat1 = wLat1 / totalCount;
        double avgLon1 = wLon1 / totalCount;
        double avgLat2 = wLat2 / totalCount;
        double avgLon2 = wLon2 / totalCount;

        String gKeyA = String.format("%.5f|%.5f", snap(avgLat1), snap(avgLon1));
        String gKeyB = String.format("%.5f|%.5f", snap(avgLat2), snap(avgLon2));

        if (gKeyA.equals(gKeyB)) return null;

        return HeatmapSegment.builder()
                .lat1(avgLat1).lon1(avgLon1)
                .lat2(avgLat2).lon2(avgLon2)
                .gridKeyA(gKeyA).gridKeyB(gKeyB)
                .traversalCount(totalCount)
                .build();
    }

    private boolean directionSimilar(HeatmapSegment a, HeatmapSegment b) {
        double diff = Math.abs(Math.toDegrees(angle(a) - angle(b))) % 180;
        if (diff > 90) diff = 180 - diff;
        return diff < ANGLE_THRESHOLD_DEG;
    }

    private double angle(HeatmapSegment s) {
        return Math.atan2(s.getLat2() - s.getLat1(), s.getLon2() - s.getLon1());
    }

    private double angleDiffDeg(double a, double b) {
        double diff = ((Math.toDegrees(a - b) % 360) + 360) % 360;
        if (diff > 180) diff -= 360;
        return diff;
    }

    private double snap(double v) {
        return Math.round(v / SNAP) * SNAP;
    }

    private long latGrid(double lat) {
        return (long) Math.floor(lat / GRID_CELL);
    }

    private long lonGrid(double lon) {
        return (long) Math.floor(lon / GRID_CELL);
    }

    private int find(int[] parent, int i) {
        if (parent[i] != i) {
            parent[i] = find(parent, parent[i]);
        }
        return parent[i];
    }

    private void union(int[] parent, int[] rank, int i, int j) {
        int ri = find(parent, i);
        int rj = find(parent, j);
        if (ri == rj) return;
        if (rank[ri] < rank[rj]) {
            parent[ri] = rj;
        } else if (rank[ri] > rank[rj]) {
            parent[rj] = ri;
        } else {
            parent[rj] = ri;
            rank[ri]++;
        }
    }
}
