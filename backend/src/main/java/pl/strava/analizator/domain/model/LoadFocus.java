package pl.strava.analizator.domain.model;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LoadFocus {

    private double lowAerobicPct;
    private double highAerobicPct;
    private double anaerobicPct;
    private double lowAerobicTarget;
    private double highAerobicTarget;
    private double anaerobicTarget;
    private Map<String, Double> zoneSeconds;
    private int totalSeconds;
}
