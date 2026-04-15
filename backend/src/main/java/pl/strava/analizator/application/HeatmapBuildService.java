package pl.strava.analizator.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class HeatmapBuildService {

    private static final double GRID_RESOLUTION = 0.00027;

    private final ActivityRepository activityRepository;
    private final HeatmapSegmentRepository heatmapSegmentRepository;
    private final HeatmapSkeletonBuilder skeletonBuilder;

    private final AtomicBoolean rebuildInProgress = new AtomicBoolean(false);

    public boolean isRebuilding() {
        return rebuildInProgress.get();
    }

    @Async
    public void rebuildAll() {
        if (!rebuildInProgress.compareAndSet(false, true)) {
            log.info("Heatmap rebuild already in progress, skipping");
            return;
        }
        try {
            log.info("Rebuilding heatmap from all activities");
            heatmapSegmentRepository.deleteAll();
            activityRepository.findWithSummaryPolylines().forEach(activity ->
                processPolyline(activity.getSummaryPolyline())
            );
            log.info("Building heatmap skeleton from {} raw segments", heatmapSegmentRepository.count());
            List<HeatmapSegment> raw = heatmapSegmentRepository.findAll();
            List<HeatmapSegment> skeleton = skeletonBuilder.buildSkeleton(raw);
            heatmapSegmentRepository.deleteAll();
            heatmapSegmentRepository.saveAll(skeleton);
            log.info("Heatmap skeleton complete: {} merged segments (from {} raw)", skeleton.size(), raw.size());
        } finally {
            rebuildInProgress.set(false);
        }
    }

    public void updateForActivity(String summaryPolyline) {
        if (summaryPolyline == null || summaryPolyline.isBlank()) return;
        processPolyline(summaryPolyline);
    }

    private void processPolyline(String polyline) {
        if (polyline == null || polyline.isBlank()) return;
        List<double[]> coords = decodePolyline(polyline);
        Set<String> seenInActivity = new HashSet<>();

        for (int i = 0; i < coords.size() - 1; i++) {
            double[] cur = coords.get(i);
            double[] nxt = coords.get(i + 1);

            String gridA = snapToGrid(cur[0], cur[1]);
            String gridB = snapToGrid(nxt[0], nxt[1]);
            if (gridA.equals(gridB)) continue;

            String keyA = gridA.compareTo(gridB) <= 0 ? gridA : gridB;
            String keyB = gridA.compareTo(gridB) <= 0 ? gridB : gridA;
            String edgeKey = keyA + "~" + keyB;

            if (seenInActivity.contains(edgeKey)) continue;
            seenInActivity.add(edgeKey);

            heatmapSegmentRepository.upsertSegment(keyA, keyB, cur[0], cur[1], nxt[0], nxt[1]);
        }
    }

    private String snapToGrid(double lat, double lng) {
        double sLat = Math.round(lat / GRID_RESOLUTION) * GRID_RESOLUTION;
        double sLng = Math.round(lng / GRID_RESOLUTION) * GRID_RESOLUTION;
        return String.format("%.5f|%.5f", sLat, sLng);
    }

    private List<double[]> decodePolyline(String encoded) {
        List<double[]> result = new ArrayList<>();
        int index = 0;
        int len = encoded.length();
        int lat = 0;
        int lng = 0;

        while (index < len) {
            int b;
            int shift = 0;
            int result2 = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result2 |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result2 & 1) != 0 ? ~(result2 >> 1) : (result2 >> 1));
            lat += dlat;

            shift = 0;
            result2 = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result2 |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result2 & 1) != 0 ? ~(result2 >> 1) : (result2 >> 1));
            lng += dlng;

            result.add(new double[]{lat / 1e5, lng / 1e5});
        }
        return result;
    }
}
