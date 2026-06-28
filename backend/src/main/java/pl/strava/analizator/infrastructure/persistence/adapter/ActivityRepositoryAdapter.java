package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.vo.ActivityFilter;
import pl.strava.analizator.domain.vo.ActivityPage;
import pl.strava.analizator.domain.vo.ActivityTimelineEntry;
import pl.strava.analizator.infrastructure.persistence.ActivitySpecifications;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.ActivityEntityMapper;

@Component
@RequiredArgsConstructor
public class ActivityRepositoryAdapter implements ActivityRepository {

    private final ActivityJpaRepository jpaRepository;
    private final ActivityEntityMapper mapper;

    @Override
    public Activity save(Activity activity) {
        ActivityEntity entity = mapper.toEntity(activity);
        ActivityEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Activity> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Activity> findByExternalIdAndSource(String externalId, String source) {
        return jpaRepository.findByExternalIdAndSource(externalId, source).map(mapper::toDomain);
    }

    @Override
    public List<Activity> findByStartedAtBetween(OffsetDateTime from, OffsetDateTime to) {
        return jpaRepository.findByStartedAtBetweenOrderByStartedAtDesc(from, to)
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Activity> findBySportTypeAndStartedAtBetween(String sportType, OffsetDateTime from, OffsetDateTime to) {
        return jpaRepository.findBySportTypeAndStartedAtBetweenOrderByStartedAtDesc(sportType, from, to)
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Activity> findRecentActivities(int limit) {
        return jpaRepository.findAllByOrderByStartedAtDesc(PageRequest.of(0, limit))
                .getContent().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Activity> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Activity> findBySource(String source) {
        return jpaRepository.findBySourceOrderByStartedAtDesc(source)
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Activity> findWithSummaryPolylines() {
        return jpaRepository.findBySummaryPolylineIsNotNullOrderByStartedAtDesc()
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    public ActivityPage findPaged(String sportType, int page, int size) {
        PageRequest pr = PageRequest.of(page, size);
        org.springframework.data.domain.Page<ActivityEntity> result = sportType != null
            ? jpaRepository.findBySportTypeOrderByStartedAtDesc(sportType, pr)
            : jpaRepository.findAllByOrderByStartedAtDesc(pr);
        List<Activity> items = result.getContent().stream().map(mapper::toDomain).toList();
        return new ActivityPage(items, result.getTotalElements(), page, size, result.getTotalPages());
    }

    @Override
    public ActivityPage findFiltered(ActivityFilter filter) {
        PageRequest pr = PageRequest.of(filter.page(), filter.size());
        Specification<ActivityEntity> spec = ActivitySpecifications.withFilter(filter);
        org.springframework.data.domain.Page<ActivityEntity> result = jpaRepository.findAll(spec, pr);
        List<Activity> items = result.getContent().stream().map(mapper::toDomain).toList();
        return new ActivityPage(items, result.getTotalElements(), filter.page(), filter.size(), result.getTotalPages());
    }

    @Override
    public List<ActivityTimelineEntry> getTimeline() {
        return jpaRepository.findTimeline();
    }

    @Override
    public boolean existsByExternalIdAndSource(String externalId, String source) {
        return jpaRepository.existsByExternalIdAndSource(externalId, source);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public void deleteAll() {
        jpaRepository.deleteAllInBatch();
    }

    @Override
    public int countActivitiesWithPolylines() {
        return (int) jpaRepository.countBySummaryPolylineIsNotNull();
    }

    @Override
    public double sumDistanceMetersForActivitiesWithPolylines() {
        return jpaRepository.sumDistanceMForActivitiesWithPolylines().orElse(0.0);
    }

    @Override
    public Optional<OffsetDateTime> findLatestStartedAtBySource(String source) {
        return jpaRepository.findLatestStartedAtBySource(source);
    }
}
