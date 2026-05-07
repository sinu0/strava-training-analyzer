package pl.strava.analizator.domain.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class AthleteFatigueState {

    private int score;
    private String level;
    private int atlFatigue;
    private int metabolicFatigue;
    private int loadFatigue;
    private int recoveryDebt;
    private double monotony;
    private double strain;
    private double weeklyRampRate;
    private String trend;
    private double recoveryEfficiency;
    private Instant calculatedAt;
}
