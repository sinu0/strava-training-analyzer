package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDto {
    private UUID id;
    private String name;
    private LocalDate eventDate;
    private String type;
    private String priority;
    private boolean active;
    private LocalDate createdAt;
}
