package pl.strava.analizator.infrastructure.strava.dto;

import java.util.Map;

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
public class StravaActivityPhotoDto {

    private Long id;

    @JsonProperty("unique_id")
    private String uniqueId;

    private Map<String, String> urls;

    public String bestUrl() {
        if (urls == null || urls.isEmpty()) {
            return null;
        }
        if (urls.containsKey("2048")) {
            return urls.get("2048");
        }
        if (urls.containsKey("600")) {
            return urls.get("600");
        }
        if (urls.containsKey("100")) {
            return urls.get("100");
        }
        return urls.values().stream()
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(null);
    }
}
