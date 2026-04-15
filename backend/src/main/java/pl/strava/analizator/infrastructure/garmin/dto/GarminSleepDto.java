package pl.strava.analizator.infrastructure.garmin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GarminSleepDto {

    @JsonProperty("sleepTimeSeconds")
    private Integer sleepTimeSeconds;

    @JsonProperty("deepSleepSeconds")
    private Integer deepSleepSeconds;

    @JsonProperty("lightSleepSeconds")
    private Integer lightSleepSeconds;

    @JsonProperty("remSleepSeconds")
    private Integer remSleepSeconds;

    @JsonProperty("awakeSleepSeconds")
    private Integer awakeSleepSeconds;

    @JsonProperty("sleepScores")
    private SleepScores sleepScores;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SleepScores {

        @JsonProperty("overall")
        private ScoreValue overall;

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ScoreValue {

            @JsonProperty("value")
            private Integer value;
        }
    }
}
