package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.EqualsAndHashCode;

@Getter
@EqualsAndHashCode
@Builder
@AllArgsConstructor
public class WorkoutStep {
    private final String type;
    private final String name;
    private final String instructions;
    private final String durationType;
    private final Integer durationSec;
    private final Integer powerPctFtpLow;
    private final Integer powerPctFtpHigh;
    private final Integer heartRateBpmLow;
    private final Integer heartRateBpmHigh;
    private final Integer cadenceRpmLow;
    private final Integer cadenceRpmHigh;
    private final Integer repeat;
    private final Integer onDurationSec;
    private final Integer onPowerPctFtpLow;
    private final Integer onPowerPctFtpHigh;
    private final Integer onHeartRateBpmLow;
    private final Integer onHeartRateBpmHigh;
    private final Integer onCadenceRpmLow;
    private final Integer onCadenceRpmHigh;
    private final Integer offDurationSec;
    private final Integer offPowerPctFtpLow;
    private final Integer offPowerPctFtpHigh;
    private final Integer offHeartRateBpmLow;
    private final Integer offHeartRateBpmHigh;
    private final Integer offCadenceRpmLow;
    private final Integer offCadenceRpmHigh;
}
