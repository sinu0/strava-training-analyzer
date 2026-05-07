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
        assertThat(activities.getFirst().getMap()).isNotNull();
    }
}