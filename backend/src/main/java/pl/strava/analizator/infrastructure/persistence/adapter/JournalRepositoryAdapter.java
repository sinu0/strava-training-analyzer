package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.journal.JournalEntry;
import pl.strava.analizator.domain.journal.JournalRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.JournalEntryJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.JournalEntryMapper;

@Component
@RequiredArgsConstructor
public class JournalRepositoryAdapter implements JournalRepository {

    private final JournalEntryJpaRepository jpa;
    private final JournalEntryMapper mapper;

    @Override
    public List<JournalEntry> findByDateRange(LocalDate from, LocalDate to) {
        return jpa.findByDateRange(from, to).stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<JournalEntry> findByActivityId(UUID activityId) {
        return jpa.findByActivityId(activityId).map(mapper::toDomain);
    }

    @Override
    public List<JournalEntry> findRecent(int limit) {
        return jpa.findRecent(limit).stream().map(mapper::toDomain).toList();
    }

    @Override
    public JournalEntry save(JournalEntry entry) {
        return mapper.toDomain(jpa.save(mapper.toEntity(entry)));
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }
}
