package pl.strava.analizator.application;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.SegmentEffort;

@Component
public class SegmentRecordDetector {

    public List<SegmentEffort> detect(List<SegmentEffort> efforts) {
        List<SegmentEffort> chronological = efforts.stream()
                .sorted(Comparator.comparing(SegmentEffort::getStartedAt)
                        .thenComparing(effort -> effort.getId() != null ? effort.getId().toString() : ""))
                .toList();
        Integer best = null;
        java.util.ArrayList<SegmentEffort> result = new java.util.ArrayList<>(chronological.size());
        for (SegmentEffort effort : chronological) {
            Integer elapsed = effort.getElapsedTimeSec();
            boolean record = elapsed != null && elapsed > 0 && (best == null || elapsed < best);
            result.add(effort.toBuilder()
                    .recordAtTime(record)
                    .previousBestElapsedTimeSec(best)
                    .build());
            if (record) best = elapsed;
        }
        return result;
    }
}
