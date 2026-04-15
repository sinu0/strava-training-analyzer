package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WorkoutStep {
    private final String type;
    private final Integer durationSec;
    private final Integer powerPctFtpLow;
    private final Integer powerPctFtpHigh;
    private final Integer repeat;
    private final Integer onDurationSec;
    private final Integer onPowerPctFtpLow;
    private final Integer onPowerPctFtpHigh;
    private final Integer offDurationSec;
    private final Integer offPowerPctFtpLow;
    private final Integer offPowerPctFtpHigh;
}
