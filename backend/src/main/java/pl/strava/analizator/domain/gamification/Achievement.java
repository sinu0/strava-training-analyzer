package pl.strava.analizator.domain.gamification;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Achievement {

    private String id;
    private String name;
    private String description;
    private String icon;
    private AchievementType type;
    private LocalDate unlockedAt;
    private boolean unlocked;
}
