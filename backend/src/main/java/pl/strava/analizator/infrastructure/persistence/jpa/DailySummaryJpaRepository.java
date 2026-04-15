package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.DailySummaryEntity;

@Repository
public interface DailySummaryJpaRepository extends JpaRepository<DailySummaryEntity, UUID> {

    Optional<DailySummaryEntity> findByDate(LocalDate date);

    List<DailySummaryEntity> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);

    @Query("SELECT MAX(d.garminSyncedAt) FROM DailySummaryEntity d WHERE d.garminSyncedAt IS NOT NULL")
    Optional<Instant> findMostRecentGarminSyncedAt();
}
