package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityRepository;

@Service
@RequiredArgsConstructor
public class RouteDiscoveryService {

    private final ActivityRepository activityRepository;

    private static final String[] DIRECTIONS = {
            "Północ", "Północny-wschód", "Wschód", "Południowy-wschód",
            "Południe", "Południowy-zachód", "Zachód", "Północny-zachód"
    };

    public List<Map<String, Object>> getUnexploredDirections() {
        List<Activity> activities = activityRepository.findRecentActivities(200);
        if (activities.isEmpty()) {
            return List.of();
        }

        // Find center point
        double centerLat = 0, centerLon = 0;
        int count = 0;
        for (var a : activities) {
            var polyline = a.getSummaryPolyline();
            if (polyline == null) continue;
            var points = decodePolyline(polyline);
            if (points.isEmpty()) continue;
            centerLat += points.get(0)[0];
            centerLon += points.get(0)[1];
            count++;
        }
        if (count == 0) return List.of();
        centerLat /= count;
        centerLon /= count;

        // Count activities in each direction sector
        int[] sectorCounts = new int[8];
        for (var a : activities) {
            var polyline = a.getSummaryPolyline();
            if (polyline == null) continue;
            var points = decodePolyline(polyline);
            if (points.isEmpty()) continue;
            double midLat = points.get(points.size() / 2)[0];
            double midLon = points.get(points.size() / 2)[1];
            double bearing = bearing(centerLat, centerLon, midLat, midLon);
            int sector = (int) Math.floor((bearing + 22.5) / 45.0) % 8;
            sectorCounts[sector]++;
        }

        int maxCount = java.util.Arrays.stream(sectorCounts).max().orElse(1);

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            double exploredPct = maxCount > 0 ? Math.min(100, Math.round(sectorCounts[i] * 1000.0 / maxCount) / 10.0) : 0;
            Map<String, Object> dir = new LinkedHashMap<>();
            dir.put("direction", DIRECTIONS[i]);
            dir.put("bearing", i * 45);
            dir.put("activities", sectorCounts[i]);
            dir.put("exploredPercent", exploredPct);
            dir.put("novelty", sectorCounts[i] <= 1 ? "high" : sectorCounts[i] <= 3 ? "medium" : "low");
            result.add(dir);
        }

        result.sort(Comparator.<Map<String, Object>, Double>comparing(d -> (Double) d.get("exploredPercent")));
        return result;
    }

    private double bearing(double lat1, double lon1, double lat2, double lon2) {
        double dLon = Math.toRadians(lon2 - lon1);
        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);
        double y = Math.sin(dLon) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        return (Math.toDegrees(Math.atan2(y, x)) + 360) % 360;
    }

    private List<double[]> decodePolyline(String polyline) {
        List<double[]> points = new ArrayList<>();
        if (polyline == null || polyline.isEmpty()) return points;
        int index = 0, len = polyline.length();
        double lat = 0, lon = 0;
        while (index < len) {
            int shift = 0, result = 0;
            int b;
            do {
                b = polyline.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = polyline.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlon = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lon += dlon;
            points.add(new double[]{lat / 1e5, lon / 1e5});
        }
        return points;
    }
}
