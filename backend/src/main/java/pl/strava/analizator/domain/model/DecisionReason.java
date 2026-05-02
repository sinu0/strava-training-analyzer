package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DecisionReason {
    private final String priority;   // SAFETY, ADAPTATION, PLAN, CONTEXT
    private final String signal;     // e.g. "TSB", "HRV", "WEATHER", "TIME"
    private final String message;    // human-readable reason
    private final String evidence;   // data backing the reason
}
