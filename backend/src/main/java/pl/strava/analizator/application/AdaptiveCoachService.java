package pl.strava.analizator.application;

import java.util.List;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AdaptiveCoachRequest;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.domain.coach.model.PostSessionFeedback;
import pl.strava.analizator.domain.model.TrainingDecision;
import pl.strava.analizator.domain.model.TrainingDecisionEngine;

/** Compatibility adapter; public coach endpoints share one snapshot and policy. */
@Service
@RequiredArgsConstructor
public class AdaptiveCoachService {
    private final CoachingService coaching;
    private final AthleteSnapshotService snapshots;

    public AdaptiveCoachResponse decideWithRealData(AdaptiveCoachRequest request) {
        var snapshot = snapshots.today();
        if (request.getTimeAvailableMinutes() != null) {
            if (request.getTimeAvailableMinutes() < 0 || request.getTimeAvailableMinutes() > 720) {
                throw new IllegalArgumentException("Dostępny czas: 0–720 minut");
            }
            snapshot = snapshot.toBuilder().availableMinutes(request.getTimeAvailableMinutes()).build();
        }
        return response(new TrainingDecisionEngine().decide(snapshot));
    }

    public void processFeedback(PostSessionFeedback feedback) {
        coaching.record(feedback);
    }

    private AdaptiveCoachResponse response(TrainingDecision decision) {
        var session = decision.getSessionType() == null ? null : AdaptiveCoachResponse.SessionOptionDto.builder()
                .type(decision.getSessionType()).durationMinutes(decision.getDurationMinutes())
                .targetTss(decision.getTargetTss()).description(decision.getDescription()).build();
        return AdaptiveCoachResponse.builder().decision(decision.getDecision()).bestSession(session)
                .alternatives(List.of()).allScoredSessions(session == null ? List.of() : List.of(session))
                .reasoning(decision.getReasons()).insight(decision.getDescription())
                .confidence(decision.getConfidence()).algorithmVersion(decision.getAlgorithmVersion())
                .risk(AdaptiveCoachResponse.RiskDto.builder().level("UNKNOWN")
                        .primaryRisk("Nie oceniono ryzyka fizjologicznego.").build()).build();
    }
}
