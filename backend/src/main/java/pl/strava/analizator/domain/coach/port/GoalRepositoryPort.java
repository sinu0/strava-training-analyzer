package pl.strava.analizator.domain.coach.port;

import java.util.List;
import java.util.Optional;

import pl.strava.analizator.domain.coach.model.Goal;

public interface GoalRepositoryPort {
    List<Goal> findAll();
    List<Goal> findPrimary();
    Optional<Goal> findById(String id);
    Goal save(Goal goal);
    void deleteById(String id);
}
