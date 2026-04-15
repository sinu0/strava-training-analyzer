package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RouteWaypoint;
import pl.strava.analizator.domain.port.PlannedRouteRepository;
import pl.strava.analizator.infrastructure.persistence.entity.PlannedRouteEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.PlannedRouteJpaRepository;

@Component
@RequiredArgsConstructor
public class PlannedRouteRepositoryAdapter implements PlannedRouteRepository {

    private final PlannedRouteJpaRepository jpaRepository;
    private final ObjectMapper objectMapper;

    @Override
    public PlannedRoute save(PlannedRoute route) {
        PlannedRouteEntity entity = toEntity(route);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<PlannedRoute> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<PlannedRoute> findAll() {
        return jpaRepository.findAllLimited().stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @SneakyThrows
    private PlannedRouteEntity toEntity(PlannedRoute route) {
        return PlannedRouteEntity.builder()
                .id(route.getId())
                .name(route.getName())
                .description(route.getDescription())
                .waypoints(route.getWaypoints() != null ? objectMapper.writeValueAsString(route.getWaypoints()) : null)
                .polyline(route.getPolyline() != null ? objectMapper.writeValueAsString(route.getPolyline()) : null)
                .totalDistanceM(route.getTotalDistanceM())
                .totalElevationGainM(route.getTotalElevationGainM())
                .totalElevationLossM(route.getTotalElevationLossM())
                .estimatedTimeSec(route.getEstimatedTimeSec())
                .estimatedTss(route.getEstimatedTss())
                .createdAt(route.getCreatedAt())
                .updatedAt(route.getUpdatedAt())
                .build();
    }

    @SneakyThrows
    private PlannedRoute toDomain(PlannedRouteEntity entity) {
        List<RouteWaypoint> waypoints = entity.getWaypoints() != null
                ? objectMapper.readValue(entity.getWaypoints(), new TypeReference<>() {})
                : null;
        List<double[]> polyline = entity.getPolyline() != null
                ? objectMapper.readValue(entity.getPolyline(), new TypeReference<>() {})
                : null;

        return PlannedRoute.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .waypoints(waypoints)
                .polyline(polyline)
                .totalDistanceM(entity.getTotalDistanceM())
                .totalElevationGainM(entity.getTotalElevationGainM())
                .totalElevationLossM(entity.getTotalElevationLossM())
                .estimatedTimeSec(entity.getEstimatedTimeSec())
                .estimatedTss(entity.getEstimatedTss())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
