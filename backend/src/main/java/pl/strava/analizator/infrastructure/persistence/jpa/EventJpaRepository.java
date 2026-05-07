package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.EventEntity;

public interface EventJpaRepository extends JpaRepository<EventEntity, UUID> {
    List<EventEntity> findAllByActiveTrueOrderByEventDateAsc();
    List<EventEntity> findAllByOrderByEventDateAsc();
}
