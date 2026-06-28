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
public class PersonalRecordDto {

    private UUID id;
    private String recordType;
    private double recordValue;
    private UUID activityId;
    private LocalDate achievedAt;
    private Double previousValue;
    private Double improvementPercent;
    private String label;
    private String unit;
}
