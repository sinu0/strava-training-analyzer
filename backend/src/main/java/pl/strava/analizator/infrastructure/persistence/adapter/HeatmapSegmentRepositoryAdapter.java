package pl.strava.analizator.infrastructure.persistence.adapter;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;
import pl.strava.analizator.infrastructure.persistence.entity.HeatmapSegmentEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.HeatmapSegmentJpaRepository;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class HeatmapSegmentRepositoryAdapter implements HeatmapSegmentRepository {

    private final HeatmapSegmentJpaRepository jpaRepository;

    @Override
    public void upsertSegment(String gridKeyA, String gridKeyB,
                               double lat1, double lon1, double lat2, double lon2) {
        var entity = jpaRepository.findByGridKeyAAndGridKeyB(gridKeyA, gridKeyB)
                .orElseGet(() -> {
                    var e = new HeatmapSegmentEntity();
                    e.setGridKeyA(gridKeyA);
                    e.setGridKeyB(gridKeyB);
                    e.setLat1(lat1);
                    e.setLon1(lon1);
                    e.setLat2(lat2);
                    e.setLon2(lon2);
                    e.setTraversalCount(0);
                    return e;
                });
        entity.setTraversalCount(entity.getTraversalCount() + 1);
        jpaRepository.save(entity);
    }

    @Override
    public List<HeatmapSegment> findAll() {
        return jpaRepository.findAll().stream()
                .map(e -> HeatmapSegment.builder()
                        .id(e.getId())
                        .lat1(e.getLat1()).lon1(e.getLon1())
                        .lat2(e.getLat2()).lon2(e.getLon2())
                        .gridKeyA(e.getGridKeyA()).gridKeyB(e.getGridKeyB())
                        .traversalCount(e.getTraversalCount())
                        .build())
                .toList();
    }

    @Override
    public List<HeatmapSegment> findInBounds(double minLat, double maxLat, double minLon, double maxLon) {
        return jpaRepository.findInBounds(minLat, maxLat, minLon, maxLon).stream()
                .map(e -> HeatmapSegment.builder()
                        .id(e.getId())
                        .lat1(e.getLat1()).lon1(e.getLon1())
                        .lat2(e.getLat2()).lon2(e.getLon2())
                        .gridKeyA(e.getGridKeyA()).gridKeyB(e.getGridKeyB())
                        .traversalCount(e.getTraversalCount())
                        .build())
                .toList();
    }

    @Override
    public int findMaxTraversalCount() {
        return jpaRepository.findMaxTraversalCount().orElse(1);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    @Override
    public void deleteAll() {
        jpaRepository.deleteAll();
    }

    @Override
    public void saveAll(List<HeatmapSegment> segments) {
        // Deduplicate: skeleton may produce segments whose snapped gridKeys collide.
        // Merge collisions with weighted-average coords and summed traversal count.
        Map<String, HeatmapSegmentEntity> deduped = new LinkedHashMap<>();
        for (HeatmapSegment seg : segments) {
            String key = seg.getGridKeyA() + "~" + seg.getGridKeyB();
            deduped.merge(key, toEntity(seg), (existing, incoming) -> {
                int total = existing.getTraversalCount() + incoming.getTraversalCount();
                double w1 = (double) existing.getTraversalCount() / total;
                double w2 = (double) incoming.getTraversalCount() / total;
                existing.setLat1(existing.getLat1() * w1 + incoming.getLat1() * w2);
                existing.setLon1(existing.getLon1() * w1 + incoming.getLon1() * w2);
                existing.setLat2(existing.getLat2() * w1 + incoming.getLat2() * w2);
                existing.setLon2(existing.getLon2() * w1 + incoming.getLon2() * w2);
                existing.setTraversalCount(total);
                return existing;
            });
        }
        jpaRepository.saveAll(new ArrayList<>(deduped.values()));
    }

    private static HeatmapSegmentEntity toEntity(HeatmapSegment seg) {
        var e = new HeatmapSegmentEntity();
        e.setGridKeyA(seg.getGridKeyA());
        e.setGridKeyB(seg.getGridKeyB());
        e.setLat1(seg.getLat1());
        e.setLon1(seg.getLon1());
        e.setLat2(seg.getLat2());
        e.setLon2(seg.getLon2());
        e.setTraversalCount(seg.getTraversalCount());
        return e;
    }
}
