package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.RideSampleChunkEntity;

public interface RideSampleChunkJpaRepository extends JpaRepository<RideSampleChunkEntity, RideSampleChunkEntity.Key> {
    List<RideSampleChunkEntity> findByIdExecutionIdOrderByIdChunkIndexAsc(UUID executionId);
}
