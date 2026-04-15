package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.PlannedRoute;

public interface PlannedRouteRepository {
    PlannedRoute save(PlannedRoute route);
    Optional<PlannedRoute> findById(UUID id);
    List<PlannedRoute> findAll();
    void deleteById(UUID id);
}
