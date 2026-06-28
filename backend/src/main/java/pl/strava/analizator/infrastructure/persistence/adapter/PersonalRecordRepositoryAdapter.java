package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.gamification.PersonalRecord;
import pl.strava.analizator.domain.gamification.PersonalRecordType;
import pl.strava.analizator.domain.port.PersonalRecordRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.PersonalRecordJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.PersonalRecordMapper;

@Component
@RequiredArgsConstructor
public class PersonalRecordRepositoryAdapter implements PersonalRecordRepository {

    private final PersonalRecordJpaRepository jpa;
    private final PersonalRecordMapper mapper;

    @Override
    public List<PersonalRecord> findAll() {
        return jpa.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<PersonalRecord> findByType(PersonalRecordType type) {
        return jpa.findByRecordType(type.name()).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<PersonalRecord> findRecent(int days) {
        return jpa.findRecent(LocalDate.now().minusDays(days)).stream().map(mapper::toDomain).toList();
    }

    @Override
    public void save(PersonalRecord record) {
        var entity = mapper.toEntity(record);
        entity.setCreatedAt(java.time.Instant.now());
        jpa.save(entity);
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }
}
