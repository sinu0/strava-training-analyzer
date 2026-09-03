package pl.strava.analizator.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import pl.strava.analizator.infrastructure.persistence.entity.SegmentEntity;

public interface SegmentJpaRepository extends JpaRepository<SegmentEntity, Long>, JpaSpecificationExecutor<SegmentEntity> {}
