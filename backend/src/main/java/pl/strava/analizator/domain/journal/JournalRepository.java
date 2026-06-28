package pl.strava.analizator.domain.journal;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JournalRepository {

    List<JournalEntry> findByDateRange(LocalDate from, LocalDate to);

    Optional<JournalEntry> findByActivityId(UUID activityId);

    List<JournalEntry> findRecent(int limit);

    JournalEntry save(JournalEntry entry);

    void deleteById(UUID id);
}
