package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
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
public class ActivityTrainingEffectDto {

    private UUID id;
    private UUID activityId;
    private int trainingScore;
    private BigDecimal aerobicTe;
    private BigDecimal anaerobicTe;
    private String aerobicLabel;
    private String anaerobicLabel;
    private String primaryBenefit;
    private String secondaryBenefit;
    private int recoveryTimeHours;
    private Instant calculatedAt;
    private String dataQuality;
    private Map<String, Object> details;
}
