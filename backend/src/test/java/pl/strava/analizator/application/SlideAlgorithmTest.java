package pl.strava.analizator.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.strava.analizator.domain.model.HeatmapPoint;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SlideAlgorithmTest {

    private SlideAlgorithm slider;
    private SlideAlgorithm.DensitySurface flatSurface;

    @BeforeEach
    void setUp() {
        slider = new SlideAlgorithm();
        flatSurface = new SlideAlgorithm.DensitySurface() {
            @Override public HeatmapPoint gradientAt(HeatmapPoint p) { return HeatmapPoint.zero(); }
            @Override public double valueAt(HeatmapPoint p) { return 0; }
        };
    }

    @Test
    void slideReturnsInputIfTooShort() {
        List<HeatmapPoint> input = List.of(new HeatmapPoint(50.0, 19.0), new HeatmapPoint(50.1, 19.1));
        assertThat(slider.slide(input, flatSurface)).isEqualTo(input);
    }

    @Test
    void slideReturnsSmoothPath() {
        List<HeatmapPoint> input = List.of(
            new HeatmapPoint(50.000, 19.000),
            new HeatmapPoint(50.001, 19.002),
            new HeatmapPoint(50.002, 19.001),
            new HeatmapPoint(50.003, 19.003)
        );
        List<HeatmapPoint> result = slider.slide(input, flatSurface);
        assertThat(result).isNotEmpty();
        assertThat(result.get(0)).isEqualTo(input.get(0));
        assertThat(result.get(result.size() - 1)).isEqualTo(input.get(input.size() - 1));
    }

    @Test
    void resampleProducesEvenlySpacedPoints() {
        List<HeatmapPoint> input = List.of(
            new HeatmapPoint(50.000, 19.000),
            new HeatmapPoint(50.010, 19.000)
        );
        double interval = 0.002;
        List<HeatmapPoint> resampled = SlideAlgorithm.resample(input, interval);
        assertThat(resampled.size()).isGreaterThan(2);
        for (int i = 1; i < resampled.size() - 1; i++) {
            double d = resampled.get(i).subtract(resampled.get(i - 1)).magnitude();
            assertThat(d).isLessThanOrEqualTo(interval * 1.1);
        }
    }

    @Test
    void rdpSimplifyReducesPoints() {
        List<HeatmapPoint> pts = List.of(
            new HeatmapPoint(50.000, 19.000),
            new HeatmapPoint(50.001, 19.001),
            new HeatmapPoint(50.002, 19.002),
            new HeatmapPoint(50.003, 19.003),
            new HeatmapPoint(50.004, 19.004)
        );
        List<HeatmapPoint> simplified = SlideAlgorithm.rdpSimplify(pts, 0.00001);
        assertThat(simplified.size()).isLessThan(pts.size());
    }

    @Test
    void slideTowardHighDensitySegment() {
        HeatmapPoint target = new HeatmapPoint(50.0015, 19.0015);
        SlideAlgorithm.DensitySurface attractiveSurface = new SlideAlgorithm.DensitySurface() {
            @Override
            public HeatmapPoint gradientAt(HeatmapPoint p) {
                return target.subtract(p).normalize().scale(0.0001);
            }
            @Override public double valueAt(HeatmapPoint p) {
                return 1.0 - p.subtract(target).magnitude() / 0.01;
            }
        };
        List<HeatmapPoint> input = List.of(
            new HeatmapPoint(50.000, 19.000),
            new HeatmapPoint(50.001, 19.001),
            new HeatmapPoint(50.002, 19.000),
            new HeatmapPoint(50.003, 19.003)
        );
        List<HeatmapPoint> result = slider.slide(input, attractiveSurface);
        assertThat(result).isNotEmpty();
        assertThat(result.get(0).lat()).isCloseTo(50.000, org.assertj.core.data.Offset.offset(0.0001));
    }
}
