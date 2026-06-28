package pl.strava.analizator.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class SaveJournalEntryRequest {

    @NotNull
    private UUID activityId;

    @NotBlank
    private String mood;

    private String note;

    private List<String> tags;
}
