package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.WeightHistoryEntity;

@Repository
public interface WeightHistoryJpaRepository extends JpaRepository<WeightHistoryEntity, UUID> {

    Optional<WeightHistoryEntity> findByRecordedDate(LocalDate recordedDate);

    List<WeightHistoryEntity> findAllByOrderByRecordedDateAsc();

    @Query(value = "SELECT * FROM weight_history ORDER BY recorded_date ASC LIMIT 1000", nativeQuery = true)
    List<WeightHistoryEntity> findAllByOrderByRecordedDateAscLimited();

    @Query("SELECT w FROM WeightHistoryEntity w WHERE w.recordedDate BETWEEN :from AND :to ORDER BY w.recordedDate ASC")
    List<WeightHistoryEntity> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = "SELECT * FROM weight_history ORDER BY recorded_date DESC LIMIT 1", nativeQuery = true)
    Optional<WeightHistoryEntity> findLatest();
}
