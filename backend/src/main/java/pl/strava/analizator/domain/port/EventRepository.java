package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.Event;

public interface EventRepository {
    List<Event> findAll();
    List<Event> findAllActive();
    Optional<Event> findById(UUID id);
    Event save(Event event);
    void deleteById(UUID id);
}
