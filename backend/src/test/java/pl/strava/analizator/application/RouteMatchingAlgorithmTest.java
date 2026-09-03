package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;

class RouteMatchingAlgorithmTest {

    private final RouteMatchingAlgorithm algorithm = new RouteMatchingAlgorithm();

    @Test
    void handlesExactGpsJitterAndSmallDetour() {
        List<double[]> route = line(50.0, 19.0, 120);
        List<double[]> jitter = route.stream()
                .map(point -> new double[]{point[0] + 0.00004, point[1] - 0.00003})
                .toList();
        List<double[]> detour = copy(route);
        for (int i = 50; i < 62; i++) detour.get(i)[0] += 0.00045;

        assertThat(algorithm.compare(route, route).similarityPercent()).isGreaterThan(99);
        assertThat(algorithm.compare(route, jitter).similarityPercent()).isGreaterThan(95);
        assertThat(algorithm.compare(route, detour).similarityPercent()).isGreaterThan(85);
    }

    @Test
    void rejectsLargeDetourTruncationAndTranslatedShape() {
        List<double[]> route = line(50.0, 19.0, 120);
        List<double[]> largeDetour = copy(route);
        for (int i = 25; i < 95; i++) largeDetour.get(i)[0] += 0.006;
        List<double[]> truncated = route.subList(0, 65);
        List<double[]> translated = route.stream()
                .map(point -> new double[]{point[0] + 1, point[1] + 1})
                .toList();

        assertThat(algorithm.compare(route, largeDetour).similarityPercent()).isLessThan(80);
        assertThat(algorithm.compare(route, truncated).similarityPercent()).isLessThan(80);
        assertThat(algorithm.compare(route, translated).similarityPercent()).isLessThan(10);
    }

    @Test
    void linksReverseDirectionButKeepsItAsSeparateVariant() {
        List<double[]> route = line(50.0, 19.0, 120);
        List<double[]> reversed = new ArrayList<>(route);
        Collections.reverse(reversed);

        RouteMatchingAlgorithm.Comparison result = algorithm.compare(route, reversed);

        assertThat(result.similarityPercent()).isGreaterThan(99);
        assertThat(result.direction()).isEqualTo("REVERSE");
    }

    @Test
    void matchesLoopWithDifferentRecordedStart() {
        List<double[]> loop = loop(50.0, 19.0, 160);
        List<double[]> rotated = new ArrayList<>();
        rotated.addAll(loop.subList(70, loop.size() - 1));
        rotated.addAll(loop.subList(0, 71));

        RouteMatchingAlgorithm.Comparison result = algorithm.compare(loop, rotated);

        assertThat(result.similarityPercent()).isGreaterThan(95);
        assertThat(result.direction()).isEqualTo("SAME");
    }

    private List<double[]> line(double lat, double lng, int count) {
        List<double[]> points = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            points.add(new double[]{lat + Math.sin(i / 14.0) * 0.0003, lng + i * 0.00012});
        }
        return points;
    }

    private List<double[]> loop(double lat, double lng, int count) {
        List<double[]> points = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            double angle = Math.PI * 2 * i / (count - 1);
            points.add(new double[]{lat + Math.sin(angle) * 0.01, lng + Math.cos(angle) * 0.01});
        }
        return points;
    }

    private List<double[]> copy(List<double[]> points) {
        return points.stream().map(point -> point.clone()).toList();
    }
}
