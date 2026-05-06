package pl.strava.analizator.domain.coach.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdaptationDecomposition {
    private final Goal goal;
    private final List<AdaptationComponent> components;
    private final String focusArea;
    private final String explanation;
}
