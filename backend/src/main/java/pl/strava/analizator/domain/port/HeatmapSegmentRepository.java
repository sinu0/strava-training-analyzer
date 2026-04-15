package pl.strava.analizator.domain.port;

import pl.strava.analizator.domain.model.HeatmapSegment;
import java.util.List;

public interface HeatmapSegmentRepository {
    /** Insert new segment or increment count if key pair already exists */
    void upsertSegment(String gridKeyA, String gridKeyB,
                       double lat1, double lon1, double lat2, double lon2);
    List<HeatmapSegment> findAll();
    List<HeatmapSegment> findInBounds(double minLat, double maxLat, double minLon, double maxLon);
    int findMaxTraversalCount();
    long count();
    void deleteAll();
    void saveAll(List<HeatmapSegment> segments);
}
