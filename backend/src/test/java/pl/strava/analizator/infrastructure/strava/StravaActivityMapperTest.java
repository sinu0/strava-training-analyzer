package pl.strava.analizator.infrastructure.strava;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.infrastructure.strava.dto.StravaActivityDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaStreamDto;

class StravaActivityMapperTest {

    private final StravaActivityMapper mapper = new StravaActivityMapper();

    @Test
    void mapsBasicFieldsCorrectly() {
        StravaActivityDto dto = StravaActivityDto.builder()
                .id(12345L)
                .name("Morning Ride")
                .sportType("Ride")
                .startDate("2024-06-15T07:30:00Z")
                .elapsedTime(3600)
                .movingTime(3500)
                .distance(BigDecimal.valueOf(40000))
                .totalElevationGain(BigDecimal.valueOf(500))
                .averageSpeed(BigDecimal.valueOf(11.4))
                .maxSpeed(BigDecimal.valueOf(15.2))
                .averageHeartrate(BigDecimal.valueOf(145))
                .maxHeartrate(BigDecimal.valueOf(175))
                .averageWatts(BigDecimal.valueOf(220))
                .maxWatts(BigDecimal.valueOf(650))
                .averageCadence(BigDecimal.valueOf(85))
                .maxCadence(BigDecimal.valueOf(102))
                .calories(BigDecimal.valueOf(900))
                .map(new StravaActivityDto.MapData("polyline123"))
                .build();

        Activity activity = mapper.toDomain(dto, List.of());

        assertThat(activity.getExternalId()).isEqualTo("12345");
        assertThat(activity.getSource()).isEqualTo("strava");
        assertThat(activity.getSportType()).isEqualTo("cycling");
        assertThat(activity.getName()).isEqualTo("Morning Ride");
        assertThat(activity.getElapsedTimeSec()).isEqualTo(3600);
        assertThat(activity.getMovingTimeSec()).isEqualTo(3500);
        assertThat(activity.getAvgHeartrate()).isEqualTo((short) 145);
        assertThat(activity.getAvgPowerW()).isEqualTo((short) 220);
        assertThat(activity.getMaxCadence()).isEqualTo((short) 102);
        assertThat(activity.getCalories()).isEqualTo(900);
        assertThat(activity.getSummaryPolyline()).isEqualTo("polyline123");
    }

    @Test
    void mapsStreamsCorrectly() {
        StravaActivityDto dto = StravaActivityDto.builder()
                .id(1L)
                .name("Test")
                .sportType("Ride")
                .startDate("2024-01-01T00:00:00Z")
                .build();

        List<StravaStreamDto> streams = List.of(
                StravaStreamDto.builder()
                        .type("watts")
                        .data(List.of(200, 210, 220, 230))
                        .build(),
                StravaStreamDto.builder()
                        .type("heartrate")
                        .data(List.of(140, 145, 150, 155))
                        .build(),
                StravaStreamDto.builder()
                        .type("altitude")
                        .data(List.of(100.0, 101.5, 102.0, 100.5))
                        .build(),
                StravaStreamDto.builder()
                        .type("time")
                        .data(List.of(0, 1, 2, 3))
                        .build()
        );

        Activity activity = mapper.toDomain(dto, streams);

        assertThat(activity.getPowerStream()).containsExactly(200, 210, 220, 230);
        assertThat(activity.getHeartrateStream()).containsExactly(140, 145, 150, 155);
        assertThat(activity.getAltitudeStream()).containsExactly(100.0, 101.5, 102.0, 100.5);
        assertThat(activity.getTimeStream()).containsExactly(0, 1, 2, 3);
                assertThat(activity.getElevationLossM()).isEqualByComparingTo("1.5");
    }

    @Test
    void mapsPhotoUrlsAndFiltersNulls() {
        StravaActivityDto dto = StravaActivityDto.builder()
                .id(42L)
                .name("Photo Ride")
                .sportType("Ride")
                .startDate("2024-01-01T00:00:00Z")
                .build();

        List<String> photoUrls = new ArrayList<>();
        photoUrls.add("https://example.com/photo-1.jpg");
        photoUrls.add(null);
        photoUrls.add("https://example.com/photo-2.jpg");

        Activity activity = mapper.toDomain(dto, List.of(), photoUrls);

        assertThat(activity.getPhotoUrls())
                .containsExactly("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg");
    }

    @Test
    void mapsSportTypesCorrectly() {
        assertThat(mapSport("Ride")).isEqualTo("cycling");
        assertThat(mapSport("MountainBikeRide")).isEqualTo("cycling");
        assertThat(mapSport("GravelRide")).isEqualTo("cycling");
        assertThat(mapSport("Run")).isEqualTo("running");
        assertThat(mapSport("TrailRun")).isEqualTo("running");
        assertThat(mapSport("Swim")).isEqualTo("swimming");
        assertThat(mapSport("Walk")).isEqualTo("walking");
        assertThat(mapSport("Hike")).isEqualTo("walking");
        assertThat(mapSport("WeightTraining")).isEqualTo("strength");
        assertThat(mapSport("Yoga")).isEqualTo("yoga");
    }

    private String mapSport(String stravaSport) {
        StravaActivityDto dto = StravaActivityDto.builder()
                .id(1L).name("Test").sportType(stravaSport)
                .startDate("2024-01-01T00:00:00Z").build();
        return mapper.toDomain(dto, List.of()).getSportType();
    }
}
