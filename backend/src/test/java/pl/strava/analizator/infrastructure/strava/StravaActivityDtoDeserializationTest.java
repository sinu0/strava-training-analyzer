package pl.strava.analizator.infrastructure.strava;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.infrastructure.strava.dto.StravaActivityDto;

class StravaActivityDtoDeserializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesDocumentedSummaryActivityWithDecimalCaloriesAndExtraFields() throws Exception {
        String json = """
                [
                  {
                    "id": 154504250376823,
                    "name": "Happy Friday",
                    "sport_type": "MountainBikeRide",
                    "start_date": "2018-05-02T12:15:09Z",
                    "elapsed_time": 4500,
                    "moving_time": 4500,
                    "distance": 24931.4,
                    "total_elevation_gain": 0,
                    "average_speed": 5.54,
                    "max_speed": 11,
                    "average_heartrate": 140.3,
                    "average_watts": 175.3,
                    "average_cadence": 67.1,
                    "suffer_score": 82,
                    "calories": 870.2,
                    "map": {
                      "id": "a12345678987654321",
                      "summary_polyline": null,
                      "resource_state": 2
                    },
                    "private": false,
                    "unexpected_new_field": {
                      "nested": true
                    }
                  }
                ]
                """;

        List<StravaActivityDto> activities = objectMapper.readValue(json, new TypeReference<>() {});

        assertThat(activities).hasSize(1);
        assertThat(activities.getFirst().getCalories()).isEqualByComparingTo(BigDecimal.valueOf(870.2));
        assertThat(activities.getFirst().getSufferScore()).isEqualTo(82);
        assertThat(activities.getFirst().getMap()).isNotNull();
    }

    @Test
    void deserializesDetailedSegmentEffortsWithoutInventingMissingMetrics() throws Exception {
        String json = """
                {
                  "id": 42,
                  "segment_efforts": [{
                    "id": 9001,
                    "elapsed_time": 125,
                    "moving_time": 123,
                    "start_date": "2026-09-01T08:03:00Z",
                    "start_index": 10,
                    "end_index": 42,
                    "average_watts": 219.4,
                    "device_watts": true,
                    "average_heartrate": 139.2,
                    "pr_rank": 1,
                    "segment": {
                      "id": 77,
                      "name": "Klasztorna fragment",
                      "activity_type": "Ride",
                      "distance": 790.3,
                      "average_grade": 0.1,
                      "maximum_grade": 2.4,
                      "elevation_high": 197.0,
                      "elevation_low": 193.0,
                      "start_latlng": [50.1, 19.9],
                      "end_latlng": [50.2, 19.9],
                      "city": "Kraków",
                      "country": "Poland"
                    }
                  }]
                }
                """;

        StravaActivityDto activity = objectMapper.readValue(json, StravaActivityDto.class);

        assertThat(activity.getSegmentEfforts()).hasSize(1);
        var effort = activity.getSegmentEfforts().getFirst();
        assertThat(effort.getId()).isEqualTo(9001L);
        assertThat(effort.getStartIndex()).isEqualTo(10);
        assertThat(effort.getAverageCadence()).isNull();
        assertThat(effort.getSegment().getId()).isEqualTo(77L);
        assertThat(effort.getSegment().getStartLatlng()).containsExactly(50.1, 19.9);
    }
}
