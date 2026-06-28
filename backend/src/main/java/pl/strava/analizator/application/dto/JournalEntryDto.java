package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.List;
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
public class JournalEntryDto {

    private UUID id;
    private UUID activityId;
    private String mood;
    private String note;
    private List<String> tags;
    private Instant createdAt;
    private Instant updatedAt;
}
