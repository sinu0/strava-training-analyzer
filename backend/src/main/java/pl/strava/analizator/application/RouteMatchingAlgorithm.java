package pl.strava.analizator.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

@Component
public class RouteMatchingAlgorithm {

    public static final int VERSION = 1;
    private static final double MATCH_TOLERANCE_M = 85;

    public Comparison compare(List<double[]> first, List<double[]> second) {
        List<double[]> a = sanitize(first);
        List<double[]> b = sanitize(second);
        if (a.size() < 2 || b.size() < 2) return new Comparison(0, "UNKNOWN");

        double lengthA = length(a);
        double lengthB = length(b);
        double lengthRatio = Math.min(lengthA, lengthB) / Math.max(lengthA, lengthB);
        double centerDistance = haversine(center(a), center(b));
        if (centerDistance > Math.max(500, Math.max(lengthA, lengthB) * 0.25)) {
            return new Comparison(0, direction(a, b));
        }

        double coverage = Math.min(coverage(a, b), coverage(b, a));
        double similarity = 100 * coverage * Math.pow(lengthRatio, 1.45);
        return new Comparison(Math.max(0, Math.min(100, similarity)), direction(a, b));
    }

    public Draft fingerprint(List<double[]> source) {
        List<double[]> normalized = normalize(source);
        if (normalized.size() < 2) return null;
        List<double[]> reversed = new ArrayList<>(normalized);
        Collections.reverse(reversed);
        double[] center = center(normalized);
        double distance = length(normalized);
        String exact = hash(normalized);
        String reverse = hash(reversed);
        String fuzzy = String.format(Locale.ROOT, "%d:%d:%d",
                Math.round(center[0] * 100), Math.round(center[1] * 100), Math.round(distance / 500));
        return new Draft(exact, reverse, fuzzy, PolylineCodec.encodeLatLng(normalized), distance, center[0], center[1]);
    }

    public List<double[]> normalize(List<double[]> source) {
        List<double[]> points = sanitize(source);
        if (points.size() < 2) return points;
        List<double[]> sampled = resample(points, 50);
        if (isLoop(sampled)) {
            int start = 0;
            for (int i = 1; i < sampled.size() - 1; i++) {
                if (sampled.get(i)[0] < sampled.get(start)[0]
                        || (sampled.get(i)[0] == sampled.get(start)[0]
                        && sampled.get(i)[1] < sampled.get(start)[1])) start = i;
            }
            List<double[]> rotated = new ArrayList<>(sampled.size());
            for (int i = 0; i < sampled.size() - 1; i++) {
                rotated.add(sampled.get((start + i) % (sampled.size() - 1)));
            }
            rotated.add(rotated.getFirst());
            return rotated;
        }
        return sampled;
    }

    private List<double[]> sanitize(List<double[]> source) {
        if (source == null) return List.of();
        List<double[]> result = new ArrayList<>();
        double[] previous = null;
        for (double[] point : source) {
            if (point == null || point.length < 2 || !Double.isFinite(point[0]) || !Double.isFinite(point[1])) continue;
            if (previous == null || haversine(previous, point) > 0.5) {
                previous = new double[]{point[0], point[1]};
                result.add(previous);
            }
        }
        return result;
    }

    private List<double[]> resample(List<double[]> points, double spacingM) {
        double total = length(points);
        if (total <= spacingM) return points;
        List<double[]> result = new ArrayList<>();
        result.add(points.getFirst());
        double target = spacingM;
        double travelled = 0;
        for (int i = 1; i < points.size() && target < total; i++) {
            double[] from = points.get(i - 1);
            double[] to = points.get(i);
            double segment = haversine(from, to);
            while (segment > 0 && travelled + segment >= target) {
                double ratio = (target - travelled) / segment;
                result.add(new double[]{from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio});
                target += spacingM;
            }
            travelled += segment;
        }
        result.add(points.getLast());
        return result;
    }

    private double coverage(List<double[]> source, List<double[]> target) {
        double total = 0;
        for (double[] point : source) {
            double nearest = Double.MAX_VALUE;
            for (double[] candidate : target) nearest = Math.min(nearest, haversine(point, candidate));
            double normalized = nearest / MATCH_TOLERANCE_M;
            total += Math.exp(-(normalized * normalized));
        }
        return total / source.size();
    }

    private String direction(List<double[]> a, List<double[]> b) {
        if (isLoop(a) && isLoop(b)) {
            double areaA = signedArea(a);
            double areaB = signedArea(b);
            if (Math.abs(areaA) > 1e-10 && Math.abs(areaB) > 1e-10) {
                return Math.signum(areaA) == Math.signum(areaB) ? "SAME" : "REVERSE";
            }
        }
        double same = haversine(a.getFirst(), b.getFirst()) + haversine(a.getLast(), b.getLast());
        double reverse = haversine(a.getFirst(), b.getLast()) + haversine(a.getLast(), b.getFirst());
        return same <= reverse ? "SAME" : "REVERSE";
    }

    private boolean isLoop(List<double[]> points) {
        return points.size() > 3 && haversine(points.getFirst(), points.getLast()) < Math.max(120, length(points) * 0.04);
    }

    private double signedArea(List<double[]> points) {
        double area = 0;
        for (int i = 1; i < points.size(); i++) {
            area += points.get(i - 1)[1] * points.get(i)[0] - points.get(i)[1] * points.get(i - 1)[0];
        }
        return area / 2;
    }

    private double[] center(List<double[]> points) {
        double lat = 0;
        double lng = 0;
        for (double[] point : points) { lat += point[0]; lng += point[1]; }
        return new double[]{lat / points.size(), lng / points.size()};
    }

    private double length(List<double[]> points) {
        double result = 0;
        for (int i = 1; i < points.size(); i++) result += haversine(points.get(i - 1), points.get(i));
        return result;
    }

    private double haversine(double[] a, double[] b) {
        double lat1 = Math.toRadians(a[0]);
        double lat2 = Math.toRadians(b[0]);
        double dLat = lat2 - lat1;
        double dLng = Math.toRadians(b[1] - a[1]);
        double value = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
    }

    private String hash(List<double[]> points) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            StringBuilder value = new StringBuilder();
            for (double[] point : points) {
                value.append(Math.round(point[0] * 1e5)).append(',')
                        .append(Math.round(point[1] * 1e5)).append(';');
            }
            return HexFormat.of().formatHex(digest.digest(value.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    public record Comparison(double similarityPercent, String direction) {}

    public record Draft(String exactHash, String reverseHash, String fuzzyKey,
                        String normalizedPolyline, double distanceM,
                        double centerLatitude, double centerLongitude) {}
}
