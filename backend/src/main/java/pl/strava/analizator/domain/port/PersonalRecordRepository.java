package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.UUID;

import pl.strava.analizator.domain.gamification.PersonalRecord;
import pl.strava.analizator.domain.gamification.PersonalRecordType;

public interface PersonalRecordRepository {

    List<PersonalRecord> findAll();

    List<PersonalRecord> findByType(PersonalRecordType type);

    List<PersonalRecord> findRecent(int days);

    void save(PersonalRecord record);

    void deleteById(UUID id);
}
