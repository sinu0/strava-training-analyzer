package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class Event {

    private UUID id;
    private String name;
    private LocalDate eventDate;
    private String type;
    private String priority;
    private boolean active;
    private LocalDate createdAt;
}
