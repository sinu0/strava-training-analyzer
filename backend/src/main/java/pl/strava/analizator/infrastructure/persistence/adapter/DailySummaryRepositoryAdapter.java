package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.vo.DateRange;
import pl.strava.analizator.infrastructure.persistence.jpa.DailySummaryJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.DailySummaryEntityMapper;

@Component
@RequiredArgsConstructor
public class DailySummaryRepositoryAdapter implements DailySummaryRepository {

    private final DailySummaryJpaRepository jpaRepository;
    private final DailySummaryEntityMapper mapper;

    @Override
    public DailySummary save(DailySummary summary) {
        var entity = mapper.toEntity(summary);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<DailySummary> findByDate(LocalDate date) {
        return jpaRepository.findByDate(date).map(mapper::toDomain);
    }

    @Override
    public List<DailySummary> findByDateRange(DateRange range) {
        return jpaRepository.findByDateBetweenOrderByDateAsc(range.getFrom(), range.getTo())
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Instant> findMostRecentGarminSync() {
        return jpaRepository.findMostRecentGarminSyncedAt();
    }
}
