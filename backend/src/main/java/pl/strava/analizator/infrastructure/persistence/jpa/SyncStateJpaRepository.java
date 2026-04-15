package pl.strava.analizator.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.strava.analizator.infrastructure.persistence.entity.SyncStateEntity;

@Repository
public interface SyncStateJpaRepository extends JpaRepository<SyncStateEntity, Long> {}
