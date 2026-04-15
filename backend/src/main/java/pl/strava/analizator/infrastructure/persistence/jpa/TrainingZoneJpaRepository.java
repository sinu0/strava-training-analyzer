package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pl.strava.analizator.infrastructure.persistence.entity.TrainingZoneEntity;

public interface TrainingZoneJpaRepository extends JpaRepository<TrainingZoneEntity, UUID> {

        @Query("""
                        select zone
                        from TrainingZoneEntity zone
                        where zone.validFrom <= :date
                            and (zone.validTo is null or zone.validTo >= :date)
                        order by zone.zoneType asc, zone.zoneNumber asc
                        """)
        List<TrainingZoneEntity> findCurrentZones(@Param("date") LocalDate date);
}