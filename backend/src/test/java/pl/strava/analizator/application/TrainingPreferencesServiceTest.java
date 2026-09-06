package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import pl.strava.analizator.domain.model.TrainingConstraint;
import pl.strava.analizator.domain.model.TrainingPreferences;
import pl.strava.analizator.domain.port.TrainingPreferencesRepository;

class TrainingPreferencesServiceTest {
    private final TrainingPreferencesRepository repository = mock(TrainingPreferencesRepository.class);
    private final TrainingPreferencesService service = new TrainingPreferencesService(repository);

    @Test void nullConstraintTypeIsAValidationErrorNotAnInternalError() {
        var invalid = TrainingPreferences.builder().constraints(List.of(TrainingConstraint.builder()
                .from(LocalDate.now()).to(LocalDate.now()).build())).build();
        assertThatThrownBy(() -> service.save(invalid)).isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any());
    }

    @Test void zeroAvailabilityIsValidButNegativeOrExcessiveMinutesAreNot() {
        for (int minutes : List.of(-1, 721)) {
            var invalid = TrainingPreferences.builder().availableMinutes(java.util.Map.of("MONDAY", minutes)).build();
            assertThatThrownBy(() -> service.save(invalid)).isInstanceOf(IllegalArgumentException.class);
        }
        service.save(TrainingPreferences.builder().availableMinutes(java.util.Map.of("MONDAY", 0)).build());
        verify(repository).save(any());
    }
}
