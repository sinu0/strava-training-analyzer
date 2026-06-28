package pl.strava.analizator.application.dto;

import java.time.LocalDate;

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
public class SaveChallengeRequest {

    private String name;
    private String description;
    private String type;
    private double targetValue;
    private String targetUnit;
    private LocalDate startDate;
    private LocalDate endDate;
}
