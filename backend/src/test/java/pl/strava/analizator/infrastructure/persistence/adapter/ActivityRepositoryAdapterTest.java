package pl.strava.analizator.infrastructure.persistence.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.ActivityEntityMapper;

class ActivityRepositoryAdapterTest {
    @Test
    void domainUpdatePreservesAdapterOwnedMetadataAndExplicitFalseProvenance() {
        var repository = mock(ActivityJpaRepository.class);
        var mapper = Mappers.getMapper(ActivityEntityMapper.class);
        var adapter = new ActivityRepositoryAdapter(repository, mapper);
        UUID id = UUID.randomUUID();
        var raw = Map.<String, Object>of("device_watts", false);
        var stored = ActivityEntity.builder().id(id).deviceWatts(false).rawData(raw).build();
        when(repository.findById(id)).thenReturn(Optional.of(stored));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Activity saved = adapter.save(Activity.builder().id(id).name("Updated name").build());

        var captor = org.mockito.ArgumentCaptor.forClass(ActivityEntity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getRawData()).isEqualTo(raw);
        assertThat(saved.getDeviceWatts()).isFalse();
    }
}
