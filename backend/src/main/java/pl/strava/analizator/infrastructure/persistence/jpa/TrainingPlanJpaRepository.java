package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.TrainingPlanEntity;

@Repository
public interface TrainingPlanJpaRepository extends JpaRepository<TrainingPlanEntity, UUID> {
    List<TrainingPlanEntity> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);
    List<TrainingPlanEntity> findByProgramIdOrderByDateAsc(UUID programId);

    @Modifying
    @Query("UPDATE TrainingPlanEntity t SET t.status = :status WHERE t.id = :id")
    void updateStatus(@Param("id") UUID id, @Param("status") String status);
}
