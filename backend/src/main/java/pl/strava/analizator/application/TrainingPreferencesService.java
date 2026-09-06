package pl.strava.analizator.application;

import java.time.DayOfWeek;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.TrainingPreferences;
import pl.strava.analizator.domain.port.TrainingPreferencesRepository;

@Service @RequiredArgsConstructor
public class TrainingPreferencesService {
    private final TrainingPreferencesRepository repository;

    public TrainingPreferences get() { return repository.find().orElseGet(() -> TrainingPreferences.builder().build()); }

    @Transactional public TrainingPreferences save(TrainingPreferences request) {
        if (request.getRevision() != get().getRevision()) throw new UiPreferencesConflictException("Kontekst zmienił się. Odśwież dane przed zapisem.");
        if (request.getGoalType() != null && !Set.of("FTP", "ENDURANCE", "CONSISTENCY", "EVENT").contains(request.getGoalType()))
            throw new IllegalArgumentException("Nieobsługiwany cel treningowy");
        if (request.getTargetValue() != null && (!Double.isFinite(request.getTargetValue()) || request.getTargetValue() <= 0))
            throw new IllegalArgumentException("Wartość celu musi być dodatnia");
        if (request.getAvailableMinutes() == null || request.getConstraints() == null || request.getConstraints().size() > 100)
            throw new IllegalArgumentException("Wymagana dostępność i maksymalnie 100 ograniczeń");
        request.getAvailableMinutes().forEach((day, minutes) -> {
            if (day == null) throw new IllegalArgumentException("Wymagany dzień tygodnia");
            DayOfWeek.valueOf(day);
            if (minutes == null || minutes < 0 || minutes > 720) throw new IllegalArgumentException("Dostępność: 0–720 minut");
        });
        request.getConstraints().forEach(c -> {
            if (c == null || c.getType() == null || c.getFrom() == null || c.getTo() == null || c.getFrom().isAfter(c.getTo())
                    || !Set.of("BLOCKED", "RETURN_TO_TRAINING").contains(c.getType())) throw new IllegalArgumentException("Nieprawidłowy zakres lub typ ograniczenia");
            if (c.getNote() != null && c.getNote().length() > 500) throw new IllegalArgumentException("Notatka: maksymalnie 500 znaków");
        });
        if (request.getEnvironment() == null || !Set.of("MIXED", "INDOOR", "OUTDOOR").contains(request.getEnvironment())) throw new IllegalArgumentException("Nieprawidłowe środowisko treningu");
        request.setRevision(request.getRevision() + 1);
        return repository.save(request);
    }
}
