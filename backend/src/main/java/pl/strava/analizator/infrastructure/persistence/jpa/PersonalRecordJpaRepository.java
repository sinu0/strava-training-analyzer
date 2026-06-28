package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pl.strava.analizator.infrastructure.persistence.entity.PersonalRecordEntity;

public interface PersonalRecordJpaRepository extends JpaRepository<PersonalRecordEntity, UUID> {

    List<PersonalRecordEntity> findByRecordType(String recordType);

    @Query("SELECT p FROM PersonalRecordEntity p WHERE p.achievedAt >= :since ORDER BY p.achievedAt DESC")
    List<PersonalRecordEntity> findRecent(@Param("since") LocalDate since);
}
