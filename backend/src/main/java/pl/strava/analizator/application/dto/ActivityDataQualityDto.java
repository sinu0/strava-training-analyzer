package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.strava.analizator.domain.model.ActivityDataQuality;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDataQualityDto {
    private UUID activityId;
    private String status;
    private List<String> issues;
    private Instant assessedAt;

    public static ActivityDataQualityDto from(ActivityDataQuality quality) {
        return ActivityDataQualityDto.builder().activityId(quality.getActivityId())
                .status(quality.getStatus()).issues(quality.getIssues()).assessedAt(quality.getAssessedAt()).build();
    }
}
