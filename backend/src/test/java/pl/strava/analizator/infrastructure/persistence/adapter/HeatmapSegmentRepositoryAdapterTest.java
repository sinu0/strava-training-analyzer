package pl.strava.analizator.infrastructure.persistence.adapter;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.infrastructure.persistence.entity.HeatmapSegmentEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.HeatmapSegmentJpaRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HeatmapSegmentRepositoryAdapterTest {

    @Mock
    private HeatmapSegmentJpaRepository jpaRepository;

    @InjectMocks
    private HeatmapSegmentRepositoryAdapter adapter;

    @Test
    void upsertNewSegment_createsEntityWithCount1() {
        when(jpaRepository.findByGridKeyAAndGridKeyB("A1", "B2")).thenReturn(Optional.empty());

        adapter.upsertSegment("A1", "B2", 1.0, 2.0, 3.0, 4.0);

        ArgumentCaptor<HeatmapSegmentEntity> captor = ArgumentCaptor.forClass(HeatmapSegmentEntity.class);
        verify(jpaRepository).save(captor.capture());
        HeatmapSegmentEntity saved = captor.getValue();
        assertThat(saved.getTraversalCount()).isEqualTo(1);
        assertThat(saved.getGridKeyA()).isEqualTo("A1");
        assertThat(saved.getGridKeyB()).isEqualTo("B2");
        assertThat(saved.getLat1()).isEqualTo(1.0);
        assertThat(saved.getLon1()).isEqualTo(2.0);
        assertThat(saved.getLat2()).isEqualTo(3.0);
        assertThat(saved.getLon2()).isEqualTo(4.0);
    }

    @Test
    void upsertExistingSegment_incrementsCount() {
        HeatmapSegmentEntity existing = new HeatmapSegmentEntity();
        existing.setGridKeyA("A1");
        existing.setGridKeyB("B2");
        existing.setTraversalCount(3);
        when(jpaRepository.findByGridKeyAAndGridKeyB("A1", "B2")).thenReturn(Optional.of(existing));

        adapter.upsertSegment("A1", "B2", 1.0, 2.0, 3.0, 4.0);

        ArgumentCaptor<HeatmapSegmentEntity> captor = ArgumentCaptor.forClass(HeatmapSegmentEntity.class);
        verify(jpaRepository).save(captor.capture());
        assertThat(captor.getValue().getTraversalCount()).isEqualTo(4);
    }

    @Test
    void findAll_mapsEntitiesToModel() {
        HeatmapSegmentEntity entity = new HeatmapSegmentEntity();
        entity.setGridKeyA("GA");
        entity.setGridKeyB("GB");
        entity.setLat1(10.0);
        entity.setLon1(20.0);
        entity.setLat2(30.0);
        entity.setLon2(40.0);
        entity.setTraversalCount(5);
        when(jpaRepository.findAll()).thenReturn(List.of(entity));

        List<HeatmapSegment> result = adapter.findAll();

        assertThat(result).hasSize(1);
        HeatmapSegment seg = result.get(0);
        assertThat(seg.getGridKeyA()).isEqualTo("GA");
        assertThat(seg.getGridKeyB()).isEqualTo("GB");
        assertThat(seg.getLat1()).isEqualTo(10.0);
        assertThat(seg.getLon1()).isEqualTo(20.0);
        assertThat(seg.getLat2()).isEqualTo(30.0);
        assertThat(seg.getLon2()).isEqualTo(40.0);
        assertThat(seg.getTraversalCount()).isEqualTo(5);
    }

    @Test
    void findMaxTraversalCount_returns1WhenNoSegments() {
        when(jpaRepository.findMaxTraversalCount()).thenReturn(Optional.empty());

        int result = adapter.findMaxTraversalCount();

        assertThat(result).isEqualTo(1);
    }

    @Test
    void findMaxTraversalCount_returnsMaxValue() {
        when(jpaRepository.findMaxTraversalCount()).thenReturn(Optional.of(7));

        int result = adapter.findMaxTraversalCount();

        assertThat(result).isEqualTo(7);
    }

    @Test
    void deleteAll_delegatesToJpaRepository() {
        adapter.deleteAll();

        verify(jpaRepository).deleteAll();
    }
}
