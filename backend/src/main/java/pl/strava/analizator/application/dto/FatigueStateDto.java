package pl.strava.analizator.application.dto;

import java.time.Instant;
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
public class FatigueStateDto {

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
    private Instant calculatedAt;
    private int energyBudget;
    private int maxTssToday;
}
