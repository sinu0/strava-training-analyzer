package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pl.strava.analizator.infrastructure.persistence.entity.RouteFingerprintEntity;

public interface RouteFingerprintJpaRepository extends JpaRepository<RouteFingerprintEntity, UUID> {

    @Query("SELECT f FROM RouteFingerprintEntity f WHERE f.algorithmVersion = :version AND f.activityId <> :excluded "
            + "AND (f.exactHash IN (:exactHash, :reverseHash) OR f.reverseHash IN (:exactHash, :reverseHash))")
    List<RouteFingerprintEntity> findExact(@Param("exactHash") String exactHash,
                                           @Param("reverseHash") String reverseHash,
                                           @Param("version") int version,
                                           @Param("excluded") UUID excluded);

    @Query(value = """
            SELECT rf.* FROM route_fingerprints rf
            WHERE rf.algorithm_version = :version
              AND rf.capability = 'AVAILABLE'
              AND rf.activity_id <> :excluded
              AND rf.distance_m BETWEEN :minDistance AND :maxDistance
              AND ST_DWithin(
                    rf.route_geometry::geography,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :radiusMeters)
            ORDER BY ABS(rf.distance_m - :distance)
            LIMIT :limit
            """, nativeQuery = true)
    List<RouteFingerprintEntity> findNearby(@Param("latitude") double latitude,
                                            @Param("longitude") double longitude,
                                            @Param("distance") double distance,
                                            @Param("minDistance") double minDistance,
                                            @Param("maxDistance") double maxDistance,
                                            @Param("radiusMeters") double radiusMeters,
                                            @Param("version") int version,
                                            @Param("excluded") UUID excluded,
                                            @Param("limit") int limit);

    @Query(value = """
            SELECT a.id FROM activities a
            WHERE a.summary_polyline IS NOT NULL
              AND a.sport_type IN ('cycling', 'virtual_ride')
              AND NOT EXISTS (
                    SELECT 1 FROM route_fingerprints rf
                    WHERE rf.activity_id = a.id AND rf.algorithm_version = :version)
            ORDER BY a.started_at ASC
            """, nativeQuery = true)
    List<UUID> findMissingActivityIds(@Param("version") int version, Pageable pageable);

    @Query(value = """
            SELECT COUNT(*) FROM activities a
            WHERE a.summary_polyline IS NOT NULL
              AND a.sport_type IN ('cycling', 'virtual_ride')
              AND NOT EXISTS (
                    SELECT 1 FROM route_fingerprints rf
                    WHERE rf.activity_id = a.id AND rf.algorithm_version = :version)
            """, nativeQuery = true)
    long countMissing(@Param("version") int version);
}
