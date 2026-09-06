package pl.strava.analizator.application;

import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.TrainingDecision;
import pl.strava.analizator.domain.model.TrainingDecisionEngine;
import pl.strava.analizator.domain.model.CoachingFeedback;
import pl.strava.analizator.domain.port.CoachingFeedbackRepository;
import pl.strava.analizator.domain.coach.model.PostSessionFeedback;

@Service @RequiredArgsConstructor
public class CoachingService {
    private final AthleteSnapshotService snapshots;
    private final CoachingFeedbackRepository feedback;
    private final Clock clock;
    private final TrainingDecisionEngine engine = new TrainingDecisionEngine();

    public TrainingDecision today() { return engine.decide(snapshots.today()); }

    public void record(PostSessionFeedback request) {
        if (request.getRpe() < 1 || request.getRpe() > 10 || !Double.isFinite(request.getExecutionQuality())
                || request.getExecutionQuality() < 0 || request.getExecutionQuality() > 1)
            throw new IllegalArgumentException("RPE: 1–10; jakość wykonania: 0–1");
        UUID id = UUID.randomUUID();
        feedback.save(CoachingFeedback.builder().id(id).sourceKey("manual:" + id).occurredAt(clock.instant())
                .sessionType(request.getPlannedType()).rpe(request.getRpe()).quality(request.getExecutionQuality()).completed(request.isCompleted()).build());
    }
}
