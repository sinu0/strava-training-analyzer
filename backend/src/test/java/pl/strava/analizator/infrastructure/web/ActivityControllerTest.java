package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.ActivityNotFoundException;
import pl.strava.analizator.application.ActivityService;
import pl.strava.analizator.application.SyncService;
import pl.strava.analizator.application.dto.ActivityHeatmapDto;
import pl.strava.analizator.application.dto.ActivityDetailDto;
import pl.strava.analizator.application.dto.ActivityHeatmapBoundsDto;
import pl.strava.analizator.application.dto.HeatmapSegmentDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ActivityController.class)
@Import(SecurityConfig.class)
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ActivityService activityService;

    @MockitoBean
    private SyncService syncService;

    @Test
    void listActivities_returnsAll() throws Exception {
        UUID id = UUID.randomUUID();
        var summary = ActivitySummaryDto.builder()
                .id(id)
                .externalId("123")
                .sportType("cycling")
                .name("Morning Ride")
                .startedAt(OffsetDateTime.parse("2024-06-01T08:00:00Z"))
                .movingTimeSec(3600)
                .distanceM(BigDecimal.valueOf(40000))
                .build();

        ActivitySummaryPageDto page = ActivitySummaryPageDto.builder()
                .items(List.of(summary))
                .total(1)
                .page(0)
                .size(20)
                .totalPages(1)
                .build();

        when(activityService.findAll(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].name", is("Morning Ride")))
                .andExpect(jsonPath("$.items[0].sportType", is("cycling")))
                .andExpect(jsonPath("$.total", is(1)));
    }

    @Test
    void getActivity_returnsDetail() throws Exception {
        UUID id = UUID.randomUUID();
        var detail = ActivityDetailDto.builder()
                .id(id)
                .externalId("123")
                .source("strava")
                .sportType("cycling")
                .name("Morning Ride")
                .startedAt(OffsetDateTime.parse("2024-06-01T08:00:00Z"))
                .movingTimeSec(3600)
                .distanceM(BigDecimal.valueOf(40000))
                .metrics(Map.of("normalizedPower", 250.0, "tss", 85.0))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(activityService.findById(id)).thenReturn(detail);

        mockMvc.perform(get("/api/activities/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Morning Ride")))
                .andExpect(jsonPath("$.metrics.normalizedPower", is(250.0)));
    }

    @Test
    void getActivity_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(activityService.findById(id))
                .thenThrow(new ActivityNotFoundException("Activity not found: " + id));

        mockMvc.perform(get("/api/activities/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void getActivityMap_returnsGeoJson() throws Exception {
        UUID id = UUID.randomUUID();
        Map<String, Object> geoJson = Map.of(
                "type", "Feature",
                "geometry", Map.of("type", "LineString", "coordinates", List.of(List.of(19.9, 50.0), List.of(20.0, 50.1))),
                "properties", Map.of("name", "Ride", "sportType", "cycling")
        );

        when(activityService.getActivityMapGeoJson(id)).thenReturn(geoJson);

        mockMvc.perform(get("/api/activities/{id}/map", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type", is("Feature")))
                .andExpect(jsonPath("$.geometry.type", is("LineString")));
    }

    @Test
    void getActivityHeatmap_returnsAggregatedPoints() throws Exception {
        ActivityHeatmapDto heatmap = new ActivityHeatmapDto(
                List.of(new HeatmapSegmentDto(50.05, 19.95, 50.06, 19.96, 2)),
                1,
                new ActivityHeatmapBoundsDto(49.9, 19.8, 50.2, 20.1),
                12.5,
                2,
                "ready"
        );

        when(activityService.getRouteHeatmap()).thenReturn(heatmap);

        mockMvc.perform(get("/api/activities/heatmap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.segments", hasSize(1)))
                .andExpect(jsonPath("$.segments[0].lat1", is(50.05)))
                .andExpect(jsonPath("$.routeCount", is(1)))
                .andExpect(jsonPath("$.maxCount", is(2)))
                .andExpect(jsonPath("$.bounds.north", is(50.2)));
    }

    @Test
    void listActivities_sizeExceeding100_cappedAt100() throws Exception {
        ActivitySummaryPageDto page = ActivitySummaryPageDto.builder()
                .items(List.of())
                .total(0)
                .page(0)
                .size(100)
                .totalPages(0)
                .build();

        when(activityService.findAll(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt(), eq(100)))
                .thenReturn(page);

        mockMvc.perform(get("/api/activities").param("size", "999999"))
                .andExpect(status().isOk());

        verify(activityService).findAll(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), eq(0), eq(100));
    }
}
