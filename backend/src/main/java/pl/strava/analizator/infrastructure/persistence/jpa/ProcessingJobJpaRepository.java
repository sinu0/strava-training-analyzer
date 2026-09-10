package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.ProcessingJobEntity;

public interface ProcessingJobJpaRepository extends JpaRepository<ProcessingJobEntity, UUID> {

    boolean existsByJobTypeAndStatusIn(String jobType, Collection<String> statuses);

    Optional<ProcessingJobEntity> findFirstByJobTypeAndStatusInOrderByCreatedAtDesc(
            String jobType, Collection<String> statuses);

    Optional<ProcessingJobEntity> findFirstByOrderByCreatedAtDesc();

    Optional<ProcessingJobEntity> findFirstByJobTypeAndStatusAndRetryAtLessThanEqualOrderByRetryAtAsc(
            String jobType, String status, Instant retryAt);
}
