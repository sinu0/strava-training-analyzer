package pl.strava.analizator.application;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Event;
import pl.strava.analizator.domain.port.EventRepository;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public List<Event> findAll() {
        return eventRepository.findAll();
    }

    public List<Event> findActive() {
        return eventRepository.findAllActive();
    }

    public Event create(String name, LocalDate eventDate, String type, String priority) {
        Event event = Event.builder()
                .name(name)
                .eventDate(eventDate)
                .type(type != null ? type : "OTHER")
                .priority(priority != null ? priority : "B")
                .active(true)
                .createdAt(LocalDate.now())
                .build();
        return eventRepository.save(event);
    }

    public Event update(UUID id, String name, LocalDate eventDate, String type, String priority, Boolean active) {
        Event existing = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + id));
        Event.EventBuilder builder = existing.toBuilder()
                .name(name != null ? name : existing.getName())
                .eventDate(eventDate != null ? eventDate : existing.getEventDate())
                .type(type != null ? type : existing.getType())
                .priority(priority != null ? priority : existing.getPriority());
        if (active != null) builder.active(active);
        return eventRepository.save(builder.build());
    }

    public void delete(UUID id) {
        eventRepository.deleteById(id);
    }
}
