package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pl.strava.analizator.infrastructure.persistence.entity.JournalEntryEntity;

public interface JournalEntryJpaRepository extends JpaRepository<JournalEntryEntity, UUID> {

    Optional<JournalEntryEntity> findByActivityId(UUID activityId);

    @Query("SELECT j FROM JournalEntryEntity j WHERE CAST(j.createdAt AS date) BETWEEN :from AND :to ORDER BY j.createdAt DESC")
    List<JournalEntryEntity> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT j FROM JournalEntryEntity j ORDER BY j.createdAt DESC LIMIT :limit")
    List<JournalEntryEntity> findRecent(@Param("limit") int limit);
}
