package pl.strava.analizator.application.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.strava.analizator.domain.model.WorkoutStep;

@Getter
@Setter
@NoArgsConstructor
public class WorkoutStepInputDto {
    private String type;
    private String name;
    private String instructions;
    private String durationType;
    private Integer durationSec;
    private Integer powerPctFtpLow;
    private Integer powerPctFtpHigh;
    private Integer heartRateBpmLow;
    private Integer heartRateBpmHigh;
    private Integer cadenceRpmLow;
    private Integer cadenceRpmHigh;
    private Integer repeat;
    private Integer onDurationSec;
    private Integer onPowerPctFtpLow;
    private Integer onPowerPctFtpHigh;
    private Integer onHeartRateBpmLow;
    private Integer onHeartRateBpmHigh;
    private Integer onCadenceRpmLow;
    private Integer onCadenceRpmHigh;
    private Integer offDurationSec;
    private Integer offPowerPctFtpLow;
    private Integer offPowerPctFtpHigh;
    private Integer offHeartRateBpmLow;
    private Integer offHeartRateBpmHigh;
    private Integer offCadenceRpmLow;
    private Integer offCadenceRpmHigh;

    public WorkoutStep toDomain() {
        return WorkoutStep.builder().type(type).name(name).instructions(instructions).durationType(durationType)
                .durationSec(durationSec).powerPctFtpLow(powerPctFtpLow).powerPctFtpHigh(powerPctFtpHigh)
                .heartRateBpmLow(heartRateBpmLow).heartRateBpmHigh(heartRateBpmHigh)
                .cadenceRpmLow(cadenceRpmLow).cadenceRpmHigh(cadenceRpmHigh).repeat(repeat)
                .onDurationSec(onDurationSec).onPowerPctFtpLow(onPowerPctFtpLow).onPowerPctFtpHigh(onPowerPctFtpHigh)
                .onHeartRateBpmLow(onHeartRateBpmLow).onHeartRateBpmHigh(onHeartRateBpmHigh)
                .onCadenceRpmLow(onCadenceRpmLow).onCadenceRpmHigh(onCadenceRpmHigh)
                .offDurationSec(offDurationSec).offPowerPctFtpLow(offPowerPctFtpLow).offPowerPctFtpHigh(offPowerPctFtpHigh)
                .offHeartRateBpmLow(offHeartRateBpmLow).offHeartRateBpmHigh(offHeartRateBpmHigh)
                .offCadenceRpmLow(offCadenceRpmLow).offCadenceRpmHigh(offCadenceRpmHigh).build();
    }

    public static WorkoutStepInputDto fromDomain(WorkoutStep step) {
        WorkoutStepInputDto dto = new WorkoutStepInputDto();
        dto.type = step.getType();
        dto.name = step.getName();
        dto.instructions = step.getInstructions();
        dto.durationType = step.getDurationType();
        dto.durationSec = step.getDurationSec();
        dto.powerPctFtpLow = step.getPowerPctFtpLow();
        dto.powerPctFtpHigh = step.getPowerPctFtpHigh();
        dto.heartRateBpmLow = step.getHeartRateBpmLow();
        dto.heartRateBpmHigh = step.getHeartRateBpmHigh();
        dto.cadenceRpmLow = step.getCadenceRpmLow();
        dto.cadenceRpmHigh = step.getCadenceRpmHigh();
        dto.repeat = step.getRepeat();
        dto.onDurationSec = step.getOnDurationSec();
        dto.onPowerPctFtpLow = step.getOnPowerPctFtpLow();
        dto.onPowerPctFtpHigh = step.getOnPowerPctFtpHigh();
        dto.onHeartRateBpmLow = step.getOnHeartRateBpmLow();
        dto.onHeartRateBpmHigh = step.getOnHeartRateBpmHigh();
        dto.onCadenceRpmLow = step.getOnCadenceRpmLow();
        dto.onCadenceRpmHigh = step.getOnCadenceRpmHigh();
        dto.offDurationSec = step.getOffDurationSec();
        dto.offPowerPctFtpLow = step.getOffPowerPctFtpLow();
        dto.offPowerPctFtpHigh = step.getOffPowerPctFtpHigh();
        dto.offHeartRateBpmLow = step.getOffHeartRateBpmLow();
        dto.offHeartRateBpmHigh = step.getOffHeartRateBpmHigh();
        dto.offCadenceRpmLow = step.getOffCadenceRpmLow();
        dto.offCadenceRpmHigh = step.getOffCadenceRpmHigh();
        return dto;
    }
}
