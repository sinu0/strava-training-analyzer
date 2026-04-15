package pl.strava.analizator.application.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Zone distribution: zone label → percentage of total time.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneDistributionDto {

    private String zoneType;
    private Map<String, Double> zones;
    private int totalSeconds;
}
