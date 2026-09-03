package pl.strava.analizator.domain.port;

import java.util.Optional;

import pl.strava.analizator.domain.model.AnalysisBackfillState;

public interface AnalysisBackfillRepository {

    AnalysisBackfillState save(AnalysisBackfillState state);
    Optional<AnalysisBackfillState> find(String jobType);
}
