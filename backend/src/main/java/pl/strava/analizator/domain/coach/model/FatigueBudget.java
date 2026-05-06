package pl.strava.analizator.domain.coach.model;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FatigueBudget {
    private final double maxFatigue;
    private final double currentFatigue;
    private final double remaining;
    private final LocalDate periodEnd;
    private final boolean exceeded;
}
