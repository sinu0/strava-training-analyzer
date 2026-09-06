package pl.strava.analizator.domain.port;

import java.time.Instant;
import java.util.List;
import pl.strava.analizator.domain.model.CoachingFeedback;

public interface CoachingFeedbackRepository {
    void save(CoachingFeedback feedback);
    List<CoachingFeedback> findBetween(Instant from, Instant to);
}
