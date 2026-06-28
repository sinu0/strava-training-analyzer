package pl.strava.analizator.domain.gamification;

import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PersonalRecord {

    private UUID id;
    private PersonalRecordType recordType;
    private double recordValue;
    private UUID activityId;
    private LocalDate achievedAt;
    private Double previousValue;
    private Double improvementPercent;
}
