package pl.strava.analizator.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.strava.analizator.infrastructure.persistence.entity.HeatmapSegmentEntity;
import java.util.List;
import java.util.Optional;

public interface HeatmapSegmentJpaRepository extends JpaRepository<HeatmapSegmentEntity, Long> {
    Optional<HeatmapSegmentEntity> findByGridKeyAAndGridKeyB(String gridKeyA, String gridKeyB);

    @Query("SELECT MAX(e.traversalCount) FROM HeatmapSegmentEntity e")
    Optional<Integer> findMaxTraversalCount();

    @Query("SELECT e FROM HeatmapSegmentEntity e WHERE " +
           "(e.lat1 BETWEEN :minLat AND :maxLat AND e.lon1 BETWEEN :minLon AND :maxLon) OR " +
           "(e.lat2 BETWEEN :minLat AND :maxLat AND e.lon2 BETWEEN :minLon AND :maxLon)")
    List<HeatmapSegmentEntity> findInBounds(
        @Param("minLat") double minLat, @Param("maxLat") double maxLat,
        @Param("minLon") double minLon, @Param("maxLon") double maxLon);
}
