package pl.strava.analizator.application.dto;

import lombok.Getter;
import lombok.Setter;
import pl.strava.analizator.domain.model.WorkoutDeliveryCapability;

@Getter
@Setter
public class WorkoutDeliveryCapabilityDto {
    private String method;
    private String status;
    private String reason;

    public static WorkoutDeliveryCapabilityDto fromDomain(WorkoutDeliveryCapability capability) {
        WorkoutDeliveryCapabilityDto dto = new WorkoutDeliveryCapabilityDto();
        dto.method = capability.getMethod();
        dto.status = capability.getStatus();
        dto.reason = capability.getReason();
        return dto;
    }
}
