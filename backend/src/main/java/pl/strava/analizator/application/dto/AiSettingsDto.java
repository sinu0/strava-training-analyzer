package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSettingsDto {
    /** Language of AI-generated text: "pl" or "en". */
    private String language;
    @Builder.Default
    private List<String> availableLanguages = List.of();
    /** Coaching persona used when a request does not choose one (enum name of `Persona`). */
    private String coachingStyle;
    @Builder.Default
    private List<String> availableCoachingStyles = List.of();
}
