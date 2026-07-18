package pl.strava.analizator.domain.model;

import java.util.List;

public record ActivityCorePage(
        List<ActivityCoreView> items,
        long total,
        int page,
        int size,
        int totalPages) {
}
