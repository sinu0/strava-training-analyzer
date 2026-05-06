package pl.strava.analizator.application.dto;

import java.util.Map;

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
public class LoadFocusDto {

    private double lowAerobicPct;
    private double highAerobicPct;
    private double anaerobicPct;
    private double lowAerobicTarget;
    private double highAerobicTarget;
    private double anaerobicTarget;
    private Map<String, Double> zoneSeconds;
    private int totalSeconds;
}
