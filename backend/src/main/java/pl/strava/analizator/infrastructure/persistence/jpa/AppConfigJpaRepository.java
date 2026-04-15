package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.AppConfigEntity;

@Repository
public interface AppConfigJpaRepository extends JpaRepository<AppConfigEntity, UUID> {

    Optional<AppConfigEntity> findByConfigKey(String configKey);
}
