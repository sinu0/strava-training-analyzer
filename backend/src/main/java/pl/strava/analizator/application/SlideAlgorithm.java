package pl.strava.analizator.application;

import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.HeatmapPoint;

import java.util.ArrayList;
import java.util.List;

/**
 * Java port of the paulmach/slide algorithm (https://github.com/paulmach/slide).
 * Slides a coarse polyline to align with GPS density data.
 * Works in lat/lon degrees at the scale of individual roads.
 */
@Component
public class SlideAlgorithm {

    private static final double GRADIENT_SCALE  = 5.0;
    private static final double DISTANCE_SCALE  = 0.1;
    private static final double ANGLE_SCALE     = 0.005;
    private static final double MOMENTUM_SCALE  = 0.2;
    private static final int    MIN_LOOPS       = 20;
    private static final int    MAX_LOOPS       = 80;
    private static final double THRESHOLD_EPS   = 0.0005;
    private static final double SCORE_SMOOTH    = 0.2;

    // ~4m in degrees at 50°N; segments are ~30m, so 3-4 resample points per segment
    private static final double RESAMPLE_INTERVAL = 0.000036;

    public interface DensitySurface {
        /** Returns gradient vector pointing toward higher density. Works in lat/lon degrees. */
        HeatmapPoint gradientAt(HeatmapPoint p);
        /** Returns density value [0, 1] at this point. */
        double valueAt(HeatmapPoint p);
    }

    /**
     * Slides the input polyline to align with the density surface.
     * Returns simplified smoothed polyline.
     */
    public List<HeatmapPoint> slide(List<HeatmapPoint> input, DensitySurface surface) {
        if (input.size() < 3) return input;

        List<HeatmapPoint> points = resample(input, RESAMPLE_INTERVAL);
        if (points.size() < 3) return input;

        HeatmapPoint[] prevCorrections = new HeatmapPoint[points.size()];
        for (int i = 0; i < prevCorrections.length; i++) prevCorrections[i] = HeatmapPoint.zero();

        double currentScore = 0.0;

        for (int loop = 0; loop < MAX_LOOPS; loop++) {
            HeatmapPoint[] corrections = new HeatmapPoint[points.size()];
            for (int i = 0; i < corrections.length; i++) corrections[i] = HeatmapPoint.zero();

            for (int i = 1; i < points.size() - 1; i++) {
                HeatmapPoint grad  = surface.gradientAt(points.get(i)).scale(GRADIENT_SCALE);
                HeatmapPoint dist  = distanceContribution(points, i).scale(DISTANCE_SCALE);
                HeatmapPoint angle = angleContribution(points, i).scale(ANGLE_SCALE);
                HeatmapPoint mom   = prevCorrections[i].scale(MOMENTUM_SCALE);
                corrections[i] = grad.add(dist).add(angle).add(mom);
            }

            for (int i = 1; i < points.size() - 1; i++) {
                points.set(i, points.get(i).add(corrections[i]));
            }
            prevCorrections = corrections;

            double pathScore = averageSurfaceValue(points, surface);
            double previousScore = currentScore;
            currentScore = SCORE_SMOOTH * previousScore + (1 - SCORE_SMOOTH) * pathScore;

            if (loop >= MIN_LOOPS && Math.abs(currentScore - previousScore) < THRESHOLD_EPS) {
                break;
            }
        }

        return rdpSimplify(points, 0.000015);
    }

    private static HeatmapPoint distanceContribution(List<HeatmapPoint> path, int i) {
        HeatmapPoint prev = path.get(i - 1);
        HeatmapPoint curr = path.get(i);
        HeatmapPoint next = path.get(i + 1);

        HeatmapPoint v = curr.subtract(prev);
        HeatmapPoint u = next.subtract(prev);
        double dot = u.dot(u);
        if (dot == 0) return HeatmapPoint.zero();

        HeatmapPoint center = prev.add(u.scale(u.dot(v) / dot));
        return next.subtract(center).add(prev.subtract(center));
    }

    private static HeatmapPoint angleContribution(List<HeatmapPoint> path, int i) {
        HeatmapPoint n1 = path.get(i - 1).subtract(path.get(i));
        HeatmapPoint n2 = path.get(i + 1).subtract(path.get(i));
        double len1 = n1.magnitude();
        double len2 = n2.magnitude();
        if (len1 == 0 || len2 == 0) return HeatmapPoint.zero();

        HeatmapPoint n1n = n1.normalize();
        HeatmapPoint n2n = n2.normalize();
        double factor = Math.cbrt(n1n.dot(n2n)) + 1.0;
        return n1n.add(n2n).normalize().scale(Math.min(len1, len2) * factor);
    }

    static List<HeatmapPoint> resample(List<HeatmapPoint> input, double interval) {
        if (input.size() < 2) return new ArrayList<>(input);

        List<HeatmapPoint> result = new ArrayList<>();
        result.add(input.get(0));

        double remainder = 0.0;
        for (int i = 1; i < input.size(); i++) {
            HeatmapPoint from = input.get(i - 1);
            HeatmapPoint to   = input.get(i);
            double segLen = from.subtract(to).magnitude();
            if (segLen < 1e-12) continue;

            double pos = interval - remainder;
            while (pos <= segLen) {
                double t = pos / segLen;
                result.add(from.add(to.subtract(from).scale(t)));
                pos += interval;
            }
            remainder = segLen - (pos - interval);
        }
        result.add(input.get(input.size() - 1));
        return result;
    }

    static List<HeatmapPoint> rdpSimplify(List<HeatmapPoint> pts, double epsilon) {
        if (pts.size() <= 2) return new ArrayList<>(pts);
        int maxIdx = 0;
        double maxDist = 0;
        for (int i = 1; i < pts.size() - 1; i++) {
            double d = perpendicularDistance(pts.get(i), pts.get(0), pts.get(pts.size() - 1));
            if (d > maxDist) { maxDist = d; maxIdx = i; }
        }
        if (maxDist <= epsilon) {
            return List.of(pts.get(0), pts.get(pts.size() - 1));
        }
        List<HeatmapPoint> left  = rdpSimplify(pts.subList(0, maxIdx + 1), epsilon);
        List<HeatmapPoint> right = rdpSimplify(pts.subList(maxIdx, pts.size()), epsilon);
        List<HeatmapPoint> result = new ArrayList<>(left);
        result.addAll(right.subList(1, right.size()));
        return result;
    }

    private static double perpendicularDistance(HeatmapPoint p, HeatmapPoint a, HeatmapPoint b) {
        HeatmapPoint ab = b.subtract(a);
        double len = ab.magnitude();
        if (len < 1e-12) return p.subtract(a).magnitude();
        HeatmapPoint ap = p.subtract(a);
        double t = ap.dot(ab) / (len * len);
        HeatmapPoint proj = a.add(ab.scale(t));
        return p.subtract(proj).magnitude();
    }

    private static double averageSurfaceValue(List<HeatmapPoint> pts, DensitySurface surface) {
        double sum = 0;
        for (HeatmapPoint p : pts) sum += surface.valueAt(p);
        return sum / pts.size();
    }
}
