package pl.strava.analizator.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.strava.analizator.application.ActivityService;
import pl.strava.analizator.domain.model.HeatmapSegment;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import javax.imageio.ImageIO;

@RestController
@RequestMapping("/api/activities/heatmap/tile")
@RequiredArgsConstructor
public class HeatmapTileController {

    private final ActivityService activityService;

    private static final int TILE_SIZE = 256;
    private static final int RENDER_PAD = 18;
    private static final double BOUNDS_PADDING = 0.002;
    private static final int MAX_SEGMENTS_PER_TILE = 10_000;

    // Bright, visible color ramp: blue → cyan → yellow → red
    private static final double[][] COLOR_STOPS = {
        {0.0,  0x00, 0x80, 0xFF},  // bright blue
        {0.35, 0x00, 0xE5, 0xFF},  // cyan
        {0.6,  0xFF, 0xA0, 0x00},  // amber
        {0.8,  0xFF, 0x40, 0x00},  // orange-red
        {1.0,  0xFF, 0x00, 0x00}   // red
    };

    @GetMapping("/{z}/{x}/{y}.png")
    public ResponseEntity<byte[]> getTile(
            @PathVariable int z,
            @PathVariable int x,
            @PathVariable int y) {

        double[] bounds = tileBounds(z, x, y);
        List<HeatmapSegment> segments = activityService.getHeatmapSegmentsInBounds(
                bounds[0] - BOUNDS_PADDING, bounds[1] + BOUNDS_PADDING,
                bounds[2] - BOUNDS_PADDING, bounds[3] + BOUNDS_PADDING);

        if (segments.size() > MAX_SEGMENTS_PER_TILE) {
            segments = segments.stream()
                    .sorted(Comparator.comparingInt(HeatmapSegment::getTraversalCount).reversed())
                    .limit(MAX_SEGMENTS_PER_TILE)
                    .toList();
        }

        int maxCount = activityService.getHeatmapMaxCount();
        byte[] png = renderTile(z, x, y, segments, maxCount);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
                .body(png);
    }

    static double[] tileBounds(int z, int x, int y) {
        double n = Math.pow(2, z);
        double minLon = x / n * 360.0 - 180.0;
        double maxLon = (x + 1) / n * 360.0 - 180.0;
        double maxLat = Math.toDegrees(Math.atan(Math.sinh(Math.PI * (1 - 2.0 * y / n))));
        double minLat = Math.toDegrees(Math.atan(Math.sinh(Math.PI * (1 - 2.0 * (y + 1) / n))));
        return new double[]{minLat, maxLat, minLon, maxLon};
    }

    static int lonToPixel(double lon, int z, int tileX) {
        double worldX = (lon + 180.0) / 360.0 * (1L << z) * TILE_SIZE;
        return (int) Math.round(worldX - (long) tileX * TILE_SIZE);
    }

    static int latToPixel(double lat, int z, int tileY) {
        double sinLat = Math.sin(Math.toRadians(lat));
        double worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * (1L << z) * TILE_SIZE;
        return (int) Math.round(worldY - (long) tileY * TILE_SIZE);
    }

    private byte[] renderTile(int z, int x, int y, List<HeatmapSegment> segments, int maxCount) {
        float baseWidth = lineWidthForZoom(z);
        float sigma     = blurSigmaForZoom(z);
        int renderSize  = TILE_SIZE + 2 * RENDER_PAD;

        // Draw low-count segments first so high-count ones render on top
        List<HeatmapSegment> sorted = segments.stream()
                .sorted(Comparator.comparingInt(HeatmapSegment::getTraversalCount))
                .toList();

        // Phase 1: draw segments with variable width & brightness (log-normalized)
        BufferedImage padded = new BufferedImage(renderSize, renderSize, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = padded.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        for (HeatmapSegment seg : sorted) {
            double ratio = maxCount > 1
                    ? Math.log1p(seg.getTraversalCount()) / Math.log1p(maxCount)
                    : 1.0;
            // Wider lines for frequently-ridden roads; creates natural visual weight after blur
            float width = baseWidth * (float)(1.0 + ratio * 1.5);
            g.setStroke(new BasicStroke(width, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            int brightness = clamp((int)(90 + ratio * 165));
            g.setColor(new Color(brightness, brightness, brightness, 230));
            g.drawLine(
                lonToPixel(seg.getLon1(), z, x) + RENDER_PAD,
                latToPixel(seg.getLat1(), z, y) + RENDER_PAD,
                lonToPixel(seg.getLon2(), z, x) + RENDER_PAD,
                latToPixel(seg.getLat2(), z, y) + RENDER_PAD);
        }
        g.dispose();

        // Phase 2: Gaussian blur — soft glow, nearby segments merge
        BufferedImage blurred = applyGaussianBlur(padded, sigma);

        // Phase 3: per-tile normalization — Gaussian blur reduces pixel brightness by ~70%;
        // dividing by tile-max restores full color range so blue→red gradient is always visible
        int maxBrightness = 1;
        for (int py = 0; py < TILE_SIZE; py++) {
            for (int px = 0; px < TILE_SIZE; px++) {
                int rgba = blurred.getRGB(px + RENDER_PAD, py + RENDER_PAD);
                if (((rgba >> 24) & 0xFF) < 4) continue;
                int br = (rgba >> 16) & 0xFF;
                if (br > maxBrightness) maxBrightness = br;
            }
        }

        // Phase 4: colorize with per-tile-normalized density
        BufferedImage output = new BufferedImage(TILE_SIZE, TILE_SIZE, BufferedImage.TYPE_INT_ARGB);
        for (int py = 0; py < TILE_SIZE; py++) {
            for (int px = 0; px < TILE_SIZE; px++) {
                int rgba = blurred.getRGB(px + RENDER_PAD, py + RENDER_PAD);
                if (((rgba >> 24) & 0xFF) < 4) continue;
                double rawDensity = Math.min(1.0, ((rgba >> 16) & 0xFF) / (double) maxBrightness);
                double densityVal = Math.pow(rawDensity, 1.1);
                int[] color = interpolateColor(densityVal);
                int outputAlpha = clamp((int)(densityVal * 100 + 155));
                output.setRGB(px, py,
                    (outputAlpha << 24) | (color[0] << 16) | (color[1] << 8) | color[2]);
            }
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(output, "png", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to encode heatmap tile as PNG", e);
        }
    }

    private static float lineWidthForZoom(int z) {
        if (z >= 16) return 2.5f;
        if (z >= 14) return 2.0f;
        if (z >= 12) return 1.5f;
        return 1.2f;
    }

    private static float blurSigmaForZoom(int z) {
        if (z >= 16) return 3.0f;
        if (z >= 14) return 2.5f;
        if (z >= 12) return 2.0f;
        return 1.5f;
    }

    private static BufferedImage applyGaussianBlur(BufferedImage src, float sigma) {
        int size = Math.max(3, ((int)(sigma * 4)) | 1);
        float[] kernel = buildGaussianKernel(size, sigma);
        return new ConvolveOp(new Kernel(size, size, kernel), ConvolveOp.EDGE_NO_OP, null).filter(src, null);
    }

    private static float[] buildGaussianKernel(int size, float sigma) {
        float[] kernel = new float[size * size];
        int half = size / 2;
        float sum = 0;
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                int dx = i - half, dy = j - half;
                kernel[i * size + j] = (float) Math.exp(-(dx * dx + dy * dy) / (2f * sigma * sigma));
                sum += kernel[i * size + j];
            }
        }
        for (int i = 0; i < kernel.length; i++) kernel[i] /= sum;
        return kernel;
    }

    static int[] interpolateColor(double ratio) {
        int idx = 1;
        while (idx < COLOR_STOPS.length - 1 && ratio > COLOR_STOPS[idx][0]) idx++;
        double lo = COLOR_STOPS[idx - 1][0], hi = COLOR_STOPS[idx][0];
        double t = hi > lo ? (ratio - lo) / (hi - lo) : 0.0;
        return new int[]{
            clamp((int)(COLOR_STOPS[idx-1][1] + t * (COLOR_STOPS[idx][1] - COLOR_STOPS[idx-1][1]))),
            clamp((int)(COLOR_STOPS[idx-1][2] + t * (COLOR_STOPS[idx][2] - COLOR_STOPS[idx-1][2]))),
            clamp((int)(COLOR_STOPS[idx-1][3] + t * (COLOR_STOPS[idx][3] - COLOR_STOPS[idx-1][3])))
        };
    }

    private static int clamp(int v) { return Math.max(0, Math.min(255, v)); }
}
