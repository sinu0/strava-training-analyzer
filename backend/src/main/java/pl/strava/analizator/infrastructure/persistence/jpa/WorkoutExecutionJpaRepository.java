package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import pl.strava.analizator.infrastructure.persistence.entity.WorkoutExecutionEntity;

public interface WorkoutExecutionJpaRepository extends JpaRepository<WorkoutExecutionEntity, UUID> {
    Optional<WorkoutExecutionEntity> findByStartIdempotencyKey(String key);
    Optional<WorkoutExecutionEntity> findByFinishIdempotencyKey(String key);
    Optional<WorkoutExecutionEntity> findFirstByTrainingPlanIdOrderByStartedAtDesc(UUID scheduledWorkoutId);

    @Query("select e from WorkoutExecutionEntity e where e.status in ('READY','RUNNING','PAUSED') order by e.startedAt desc limit 1")
    Optional<WorkoutExecutionEntity> findActive();

    @Query("select e from WorkoutExecutionEntity e where e.status = 'COMPLETED' and e.activityId is null order by e.finishedAt")
    List<WorkoutExecutionEntity> findCompletedWithoutActivity();
}
