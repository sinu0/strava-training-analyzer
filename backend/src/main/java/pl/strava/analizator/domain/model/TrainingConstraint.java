package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TrainingConstraint {
    private LocalDate from;
    private LocalDate to;
    private String type;
    private String note;
}
