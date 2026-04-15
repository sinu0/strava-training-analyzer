package pl.strava.analizator.domain.port;

import java.time.LocalDate;
import java.util.List;

import pl.strava.analizator.domain.model.TrainingZone;

public interface TrainingZoneRepository {

    List<TrainingZone> findCurrentZones(LocalDate date);
}