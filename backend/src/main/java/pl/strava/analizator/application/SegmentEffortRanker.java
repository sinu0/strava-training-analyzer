package pl.strava.analizator.application;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.SegmentEffort;

@Component
public class SegmentEffortRanker {

    public Map<UUID, Integer> rank(List<SegmentEffort> efforts) {
        Map<UUID, Integer> ranks = new HashMap<>();
        List<SegmentEffort> ordered = efforts.stream()
                .filter(value -> value.getElapsedTimeSec() != null)
                .sorted(Comparator.comparing(SegmentEffort::getElapsedTimeSec))
                .toList();
        Integer previousTime = null;
        int currentRank = 0;
        for (int index = 0; index < ordered.size(); index++) {
            SegmentEffort effort = ordered.get(index);
            if (!effort.getElapsedTimeSec().equals(previousTime)) currentRank = index + 1;
            ranks.put(effort.getId(), currentRank);
            previousTime = effort.getElapsedTimeSec();
        }
        return ranks;
    }
}
