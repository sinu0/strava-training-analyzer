package pl.strava.analizator.application.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Power curve: best efforts by duration (seconds → watts).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PowerCurveDto {

    private Map<Integer, Double> efforts;
}
