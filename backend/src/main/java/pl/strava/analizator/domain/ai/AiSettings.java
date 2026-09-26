package pl.strava.analizator.domain.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** User-level AI preferences (single-user app, one row). */
@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class AiSettings {
    @Builder.Default
    private AiLanguage language = AiLanguage.DEFAULT;
    @Builder.Default
    private Persona coachingStyle = Persona.BALANCED_ADVISOR;

    public static AiSettings defaults() {
        return AiSettings.builder().build();
    }
}
