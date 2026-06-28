package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.challenge.Challenge;

public interface ChallengeRepository {

    List<Challenge> findAll();

    List<Challenge> findByStatus(String status);

    Optional<Challenge> findById(UUID id);

    Challenge save(Challenge challenge);

    void deleteById(UUID id);

    void updateProgress(UUID challengeId, double value);
}
