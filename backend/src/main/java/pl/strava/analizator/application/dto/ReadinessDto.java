package pl.strava.analizator.application.dto;

import java.util.List;

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
public class ReadinessDto {

    private int score;            // 0-100
    private String level;         // "pełna moc", "energia", "dobra", "zmęczenie", "trudność", "wyczerpanie"
    private double tsb;
    private double ctl;
    private double atl;
    private String description;
    private String dayType;
    private String dayLabel;
    private String dayFocus;
    private List<ReadinessSessionVariantDto> sessionVariants;
    private String tomorrowHint;
    private String bestQualityWindowLabel;
    private String qualityWindowSummary;
    private List<ReadinessWindowDto> qualityWindows;
    private ReadinessHealthSignalsDto healthSignals;
    private ReadinessCheckInDto checkIn;
}
