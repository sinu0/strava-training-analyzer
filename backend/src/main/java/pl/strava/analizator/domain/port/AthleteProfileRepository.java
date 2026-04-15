package pl.strava.analizator.domain.port;

import java.util.Optional;

import pl.strava.analizator.domain.model.AthleteProfile;

public interface AthleteProfileRepository {

    AthleteProfile save(AthleteProfile profile);

    Optional<AthleteProfile> findFirst();

    Optional<AthleteProfile> findByStravaAthleteId(Long stravaAthleteId);
}
