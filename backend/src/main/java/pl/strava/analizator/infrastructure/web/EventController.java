package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.EventService;
import pl.strava.analizator.application.TrainingStatusService;
import pl.strava.analizator.application.dto.CreateEventRequest;
import pl.strava.analizator.application.dto.EventDto;
import pl.strava.analizator.application.dto.EventProjectionDto;
import pl.strava.analizator.application.dto.TrainingStatusDto;
import pl.strava.analizator.domain.model.Event;

import java.time.temporal.ChronoUnit;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final TrainingStatusService trainingStatusService;

    @GetMapping
    public ResponseEntity<List<EventDto>> getAll() {
        return ResponseEntity.ok(
                eventService.findAll().stream().map(this::toDto).toList());
    }

    @GetMapping("/active")
    public ResponseEntity<List<EventDto>> getActive() {
        return ResponseEntity.ok(
                eventService.findActive().stream().map(this::toDto).toList());
    }

    @PostMapping
    public ResponseEntity<EventDto> create(@RequestBody CreateEventRequest request) {
        Event event = eventService.create(
                request.getName(),
                LocalDate.parse(request.getEventDate()),
                request.getType(),
                request.getPriority());
        return ResponseEntity.ok(toDto(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDto> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Event event = eventService.update(
                id,
                body.containsKey("name") ? (String) body.get("name") : null,
                body.containsKey("eventDate") ? LocalDate.parse((String) body.get("eventDate")) : null,
                body.containsKey("type") ? (String) body.get("type") : null,
                body.containsKey("priority") ? (String) body.get("priority") : null,
                body.containsKey("active") ? (Boolean) body.get("active") : null);
        return ResponseEntity.ok(toDto(event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active/projection")
    public ResponseEntity<EventProjectionDto> getActiveProjection() {
        var events = eventService.findActive();
        if (events.isEmpty()) return ResponseEntity.noContent().build();

        Event event = events.get(0);
        TrainingStatusDto status = trainingStatusService.getTrainingStatus();
        LocalDate today = LocalDate.now();
        int daysToEvent = (int) ChronoUnit.DAYS.between(today, event.getEventDate());

        double projectedCtl = 0;
        String taperText = "";
        int taperDays = 0;

        if (daysToEvent > 0) {
            double raw = status.getCurrentCtl() + status.getCtlTrend() * (daysToEvent / 7.0);
            projectedCtl = Math.round(Math.min(raw, status.getCurrentCtl() * 1.5) * 10.0) / 10.0;

            if (daysToEvent <= 14 && daysToEvent > 7) {
                taperText = "Rozpocznij taper — redukcja TSS o 30%";
                taperDays = daysToEvent;
            } else if (daysToEvent <= 7) {
                taperText = "Taper w toku — redukcja TSS o 50%";
                taperDays = daysToEvent;
            } else if (daysToEvent <= 21) {
                taperText = "Ostatnie 2 tygodnie budowania przed taperem";
                taperDays = daysToEvent - 14;
            } else {
                taperText = "Masz czas na budowanie formy";
                taperDays = daysToEvent - 14;
            }
        }

        return ResponseEntity.ok(EventProjectionDto.builder()
                .eventName(event.getName())
                .daysToEvent(daysToEvent)
                .currentCtl(status.getCurrentCtl())
                .projectedCtl(projectedCtl)
                .currentTsb(status.getCurrentTsb())
                .fatigueScore(status.getFatigue())
                .suggestedTaper(taperText)
                .taperStartDays(Math.max(0, taperDays))
                .build());
    }

    private EventDto toDto(Event e) {
        return EventDto.builder()
                .id(e.getId())
                .name(e.getName())
                .eventDate(e.getEventDate())
                .type(e.getType())
                .priority(e.getPriority())
                .active(e.isActive())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
