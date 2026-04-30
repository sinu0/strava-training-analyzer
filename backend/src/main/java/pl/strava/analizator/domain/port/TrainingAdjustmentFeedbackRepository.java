package pl.strava.analizator.domain.port;

import java.time.OffsetDateTime;
import java.util.List;

import pl.strava.analizator.domain.model.TrainingAdjustmentFeedback;

public interface TrainingAdjustmentFeedbackRepository {
    TrainingAdjustmentFeedback save(TrainingAdjustmentFeedback feedback);

    List<TrainingAdjustmentFeedback> findByCreatedAtAfter(OffsetDateTime createdAfter);
}
