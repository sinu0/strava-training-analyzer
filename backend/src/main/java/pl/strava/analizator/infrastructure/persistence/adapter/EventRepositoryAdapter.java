package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Event;
import pl.strava.analizator.domain.port.EventRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.EventJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.EventMapper;

@Component
@RequiredArgsConstructor
public class EventRepositoryAdapter implements EventRepository {

    private final EventJpaRepository jpa;
    private final EventMapper mapper;

    @Override
    public List<Event> findAll() {
        return jpa.findAllByOrderByEventDateAsc().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Event> findAllActive() {
        return jpa.findAllByActiveTrueOrderByEventDateAsc().stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Event> findById(UUID id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public Event save(Event event) {
        return mapper.toDomain(jpa.save(mapper.toEntity(event)));
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }
}
