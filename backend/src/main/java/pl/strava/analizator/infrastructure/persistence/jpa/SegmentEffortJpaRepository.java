package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.SegmentEffortEntity;

public interface SegmentEffortJpaRepository extends JpaRepository<SegmentEffortEntity, UUID> {
    Optional<SegmentEffortEntity> findByExternalId(Long externalId);
    Optional<SegmentEffortEntity> findByActivityIdAndSegmentIdAndStartIndex(UUID activityId, Long segmentId, Integer startIndex);
    List<SegmentEffortEntity> findBySegmentIdOrderByStartedAtAsc(Long segmentId);
    List<SegmentEffortEntity> findBySegmentIdInOrderBySegmentIdAscStartedAtAsc(List<Long> segmentIds);
    List<SegmentEffortEntity> findByActivityIdOrderBySequenceAsc(UUID activityId);
}
