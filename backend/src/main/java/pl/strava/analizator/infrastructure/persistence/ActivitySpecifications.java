package pl.strava.analizator.infrastructure.persistence;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import pl.strava.analizator.domain.vo.ActivityFilter;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityEntity;

public class ActivitySpecifications {

    private ActivitySpecifications() {}

    public static Specification<ActivityEntity> withFilter(ActivityFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.sportType() != null && !filter.sportType().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("sportType")), filter.sportType().toLowerCase()));
            }
            if (filter.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startedAt"), filter.from()));
            }
            if (filter.to() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startedAt"), filter.to()));
            }
            if (filter.minDistanceM() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("distanceM"), filter.minDistanceM()));
            }
            if (filter.maxDistanceM() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("distanceM"), filter.maxDistanceM()));
            }
            if (filter.minMovingTimeSec() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("movingTimeSec"), filter.minMovingTimeSec()));
            }
            if (filter.maxMovingTimeSec() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("movingTimeSec"), filter.maxMovingTimeSec()));
            }
            if (filter.minAvgPowerW() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgPowerW"), filter.minAvgPowerW()));
            }
            if (filter.maxAvgPowerW() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("avgPowerW"), filter.maxAvgPowerW()));
            }
            if (filter.minAvgHr() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgHeartrate"), filter.minAvgHr()));
            }
            if (filter.maxAvgHr() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("avgHeartrate"), filter.maxAvgHr()));
            }

            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.orderBy(cb.desc(root.get("startedAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
