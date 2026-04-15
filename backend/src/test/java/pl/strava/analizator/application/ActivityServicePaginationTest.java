package pl.strava.analizator.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.strava.analizator.application.ActivityService;
import pl.strava.analizator.application.HeatmapBuildService;
import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;
import pl.strava.analizator.domain.vo.ActivityFilter;
import pl.strava.analizator.domain.vo.ActivityPage;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServicePaginationTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository metricRepository;
    @Mock private HeatmapSegmentRepository heatmapSegmentRepository;
    @Mock private HeatmapBuildService heatmapBuildService;

    private ActivityService activityService;

    @BeforeEach
    void setUp() {
        activityService = new ActivityService(activityRepository, metricRepository, heatmapSegmentRepository, heatmapBuildService);
    }

    private Activity makeActivity(String name) {
        return Activity.builder()
                .id(UUID.randomUUID())
                .externalId(name)
                .sportType("cycling")
                .name(name)
                .build();
    }

    @Test
    void firstPageReturnsCorrectItems() {
        List<Activity> activities = List.of(makeActivity("A1"), makeActivity("A2"));
        ActivityPage page = new ActivityPage(activities, 40, 0, 20, 2);
        when(activityRepository.findFiltered(any(ActivityFilter.class))).thenReturn(page);

        ActivitySummaryPageDto result = activityService.findAll(null, null, null, null, null, null, null, null, null, null, null, 0, 20);

        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getTotal()).isEqualTo(40);
        assertThat(result.getPage()).isEqualTo(0);
        assertThat(result.getSize()).isEqualTo(20);
        assertThat(result.getTotalPages()).isEqualTo(2);
    }

    @Test
    void secondPageReturnsCorrectItems() {
        List<Activity> activities = List.of(makeActivity("B1"), makeActivity("B2"));
        ActivityPage page = new ActivityPage(activities, 40, 1, 20, 2);
        when(activityRepository.findFiltered(any(ActivityFilter.class))).thenReturn(page);

        ActivitySummaryPageDto result = activityService.findAll(null, null, null, null, null, null, null, null, null, null, null, 1, 20);

        assertThat(result.getPage()).isEqualTo(1);
        assertThat(result.getItems()).hasSize(2);
    }

    @Test
    void totalElementsIsCorrect() {
        ActivityPage page = new ActivityPage(List.of(makeActivity("C1")), 400, 0, 20, 20);
        when(activityRepository.findFiltered(any(ActivityFilter.class))).thenReturn(page);

        ActivitySummaryPageDto result = activityService.findAll(null, null, null, null, null, null, null, null, null, null, null, 0, 20);

        assertThat(result.getTotal()).isEqualTo(400);
        assertThat(result.getTotalPages()).isEqualTo(20);
    }

    @Test
    void sportTypeFilterPaginatesCorrectly() {
        List<Activity> activities = List.of(makeActivity("Run1"));
        ActivityPage page = new ActivityPage(activities, 10, 0, 20, 1);
        when(activityRepository.findFiltered(any(ActivityFilter.class))).thenReturn(page);

        ActivitySummaryPageDto result = activityService.findAll("running", null, null, null, null, null, null, null, null, null, null, 0, 20);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTotal()).isEqualTo(10);
    }

    @Test
    void summaryMappingIncludesPhotoUrls() {
        Activity activity = Activity.builder()
                .id(UUID.randomUUID())
                .externalId("photo-summary")
                .sportType("cycling")
                .name("Photo Summary")
                .photoUrls(List.of("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg"))
                .build();
        ActivityPage page = new ActivityPage(List.of(activity), 1, 0, 20, 1);
        when(activityRepository.findFiltered(any(ActivityFilter.class))).thenReturn(page);

        ActivitySummaryPageDto result = activityService.findAll(null, null, null, null, null, null, null, null, null, null, null, 0, 20);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getPhotoUrls())
                .containsExactly("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg");
    }

    @Test
    void detailMappingIncludesPhotoUrls() {
        UUID id = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(id)
                .externalId("photo-detail")
                .sportType("cycling")
                .name("Photo Detail")
                .photoUrls(List.of("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg"))
                .build();
        when(activityRepository.findById(id)).thenReturn(Optional.of(activity));
        when(metricRepository.findAllByActivityId(id)).thenReturn(List.of());

        var result = activityService.findById(id);

        assertThat(result.getPhotoUrls())
                .containsExactly("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg");
    }
}
