package pl.strava.analizator.application.dto;

import java.time.LocalDate;

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
public class AchievementDto {

    private String id;
    private String name;
    private String description;
    private String icon;
    private String type;
    private boolean unlocked;
    private LocalDate unlockedAt;
}
