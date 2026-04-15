package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;

import pl.strava.analizator.domain.gamification.Achievement;

public interface AchievementRepository {

    List<Achievement> findAll();

    Optional<Achievement> findById(String id);

    void save(Achievement achievement);
}
