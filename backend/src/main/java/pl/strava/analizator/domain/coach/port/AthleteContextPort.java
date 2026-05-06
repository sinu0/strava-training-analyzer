package pl.strava.analizator.domain.coach.port;

import java.util.List;

import pl.strava.analizator.domain.coach.model.AthleteContext;
import pl.strava.analizator.domain.coach.model.Goal;

public interface AthleteContextPort {
    AthleteContext buildContext(List<Goal> goals);
}
