package pl.strava.analizator.domain.journal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JournalEntry {

    private UUID id;
    private UUID activityId;
    private JournalMood mood;
    private String note;
    private List<String> tags;
    private Instant createdAt;
    private Instant updatedAt;
}
