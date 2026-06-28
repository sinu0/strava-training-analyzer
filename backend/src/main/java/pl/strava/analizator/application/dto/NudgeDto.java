package pl.strava.analizator.application.dto;

import java.util.Map;

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
public class NudgeDto {

    private String id;
    private String type;
    private String title;
    private String message;
    private String severity;
    private String actionUrl;
    private Map<String, Object> data;
}
