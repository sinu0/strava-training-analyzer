package pl.strava.analizator.infrastructure.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.strava.analizator.application.ActivityService;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HeatmapTileController.class)
@Import(SecurityConfig.class)
class HeatmapTileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ActivityService activityService;

    @Test
    void returnsPngForEmptyTile() throws Exception {
        when(activityService.getHeatmapSegmentsInBounds(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());
        when(activityService.getHeatmapMaxCount()).thenReturn(1);

        mockMvc.perform(get("/api/activities/heatmap/tile/12/2200/1400.png"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"));
    }

    @Test
    void returnsPngWithSegments() throws Exception {
        HeatmapSegment seg = HeatmapSegment.builder()
                .lat1(50.06).lon1(19.94).lat2(50.061).lon2(19.941).traversalCount(3)
                .gridKeyA("a").gridKeyB("b").build();

        when(activityService.getHeatmapSegmentsInBounds(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(seg));
        when(activityService.getHeatmapMaxCount()).thenReturn(5);

        byte[] body = mockMvc.perform(get("/api/activities/heatmap/tile/14/8820/5600.png"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(body).isNotEmpty();
    }

    @Test
    void tileBounds_correctForZ12X2200Y1400() {
        double[] b = HeatmapTileController.tileBounds(12, 2200, 1400);
        assertThat(b[0]).isLessThan(b[1]);
        assertThat(b[2]).isLessThan(b[3]);
        assertThat(b[0]).isGreaterThan(40.0);
        assertThat(b[1]).isLessThan(60.0);
    }

    @Test
    void colorInterpolation_ratioZeroIsBrightBlue() {
        int[] c = HeatmapTileController.interpolateColor(0.0);
        assertThat(c[0]).isEqualTo(0x00); // R=0
        assertThat(c[2]).isEqualTo(0xFF); // B=255
    }

    @Test
    void colorInterpolation_ratioOneIsRed() {
        int[] c = HeatmapTileController.interpolateColor(1.0);
        assertThat(c[0]).isEqualTo(0xFF);
        assertThat(c[1]).isEqualTo(0x00);
        assertThat(c[2]).isEqualTo(0x00);
    }

    @Test
    void lonToPixel_centerOfTileIsHalfTileSize() {
        int px = HeatmapTileController.lonToPixel(-90.0, 1, 0);
        assertThat(px).isEqualTo(128);
    }
}
