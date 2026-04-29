package pl.strava.analizator.application.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessWindowDto {
    private LocalDate date;
    private String label;
    private int score;
    private String recommendation;
    private String focus;
}
