package pl.strava.analizator.infrastructure.strava.dto;

import java.util.List;

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
public class StravaStreamDto {

    private String type;

    @JsonProperty("series_type")
    private String seriesType;

    @JsonProperty("original_size")
    private Integer originalSize;

    private String resolution;

    private List<Object> data;
}
