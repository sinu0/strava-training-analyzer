package pl.strava.analizator.application;

import java.util.List;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.SessionSuggestion;
import pl.strava.analizator.application.dto.AdaptiveCoachRequest;

/** Legacy endpoint adapter to the shared coaching policy; not a second decision engine. */
@Service
@RequiredArgsConstructor
public class SessionOptimizerService {
    private final AdaptiveCoachService coach;

    public List<SessionSuggestion> suggest(int availableMinutes) {
        var decision = coach.decideWithRealData(AdaptiveCoachRequest.builder().timeAvailableMinutes(availableMinutes).build());
        var session = decision.getBestSession();
        if (session == null) return List.of();
        return List.of(SessionSuggestion.builder().type(session.getType()).label(session.getType())
                .durationMin(session.getDurationMinutes())
                .estimatedTss(session.getTargetTss() != null ? (int)Math.round(session.getTargetTss()) : null)
                .structure(session.getDescription()).rationale(String.join(" ", decision.getReasoning()))
                .impact("Polityka: " + decision.getAlgorithmVersion() + "; pewność: " + decision.getConfidence()).build());
    }
}
