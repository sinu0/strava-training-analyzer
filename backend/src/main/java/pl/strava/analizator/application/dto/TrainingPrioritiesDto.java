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
public class TrainingPrioritiesDto {
    private CpModelDto cpModel;
    private IntervalDetectionDto intervalDetection;
    private FatigueFactorsDto fatigueFactors;
    private DurabilityProfileDto durabilityProfile;
    private PowerPhenotypeDto powerPhenotype;
    private List<TrainingPriorityDto> priorities;
}
