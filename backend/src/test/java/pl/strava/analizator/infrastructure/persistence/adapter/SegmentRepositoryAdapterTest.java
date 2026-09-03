package pl.strava.analizator.infrastructure.persistence.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.SegmentEffort;
import pl.strava.analizator.infrastructure.persistence.entity.SegmentActivityImportEntity;
import pl.strava.analizator.infrastructure.persistence.entity.SegmentEffortEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.SegmentActivityImportJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.SegmentEffortJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.SegmentJpaRepository;

@ExtendWith(MockitoExtension.class)
class SegmentRepositoryAdapterTest {
    @Mock SegmentJpaRepository segments;
    @Mock SegmentEffortJpaRepository efforts;
    @Mock SegmentActivityImportJpaRepository imports;
    @Mock ActivityJpaRepository activities;

    @Test
    void externalEffortIdMakesRepeatedImportAnUpdate() {
        UUID persistedId = UUID.randomUUID();
        SegmentEffortEntity existing = SegmentEffortEntity.builder().id(persistedId).externalId(99L)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z")).build();
        when(efforts.findByExternalId(99L)).thenReturn(Optional.of(existing));
        when(efforts.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var adapter = new SegmentRepositoryAdapter(segments, efforts, imports, activities);

        adapter.saveEffort(SegmentEffort.builder().externalId(99L).segmentId(7L).activityId(UUID.randomUUID())
                .startedAt(OffsetDateTime.parse("2026-09-01T10:00:00Z")).startIndex(3).build());

        ArgumentCaptor<SegmentEffortEntity> saved = ArgumentCaptor.forClass(SegmentEffortEntity.class);
        org.mockito.Mockito.verify(efforts).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo(persistedId);
        assertThat(saved.getValue().getCreatedAt()).isEqualTo(existing.getCreatedAt());
    }

    @Test
    void activityCapabilityPreservesUnavailableState() {
        UUID activityId = UUID.randomUUID();
        when(imports.findById(activityId)).thenReturn(Optional.of(SegmentActivityImportEntity.builder()
                .activityId(activityId).capability("UNAVAILABLE").effortCount(0).build()));
        var adapter = new SegmentRepositoryAdapter(segments, efforts, imports, activities);

        assertThat(adapter.findActivityScanCapability(activityId)).contains("UNAVAILABLE");
    }
}
