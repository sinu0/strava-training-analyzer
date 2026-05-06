package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.FatigueAndEnergyService;
import pl.strava.analizator.application.dto.FatigueStateDto;
import pl.strava.analizator.application.dto.LoadFocusDto;
import pl.strava.analizator.domain.model.AthleteFatigueState;
import pl.strava.analizator.domain.model.LoadFocus;

@RestController
@RequestMapping("/api/fatigue-energy")
@RequiredArgsConstructor
public class FatigueAndEnergyController {

    private final FatigueAndEnergyService service;

    @GetMapping("/state")
    public ResponseEntity<FatigueStateDto> getState() {
        LocalDate today = LocalDate.now();
        AthleteFatigueState fatigue = service.getCurrentFatigue(today);
        int energyBudget = service.getEnergyBudget(today);
        int maxTss = service.getMaxTssToday(today);

        return ResponseEntity.ok(FatigueStateDto.builder()
                .score(fatigue.getScore())
                .level(fatigue.getLevel())
                .atlFatigue(fatigue.getAtlFatigue())
                .metabolicFatigue(fatigue.getMetabolicFatigue())
                .loadFatigue(fatigue.getLoadFatigue())
                .recoveryDebt(fatigue.getRecoveryDebt())
                .monotony(fatigue.getMonotony())
                .strain(fatigue.getStrain())
                .weeklyRampRate(fatigue.getWeeklyRampRate())
                .trend(fatigue.getTrend())
                .calculatedAt(fatigue.getCalculatedAt())
                .energyBudget(energyBudget)
                .maxTssToday(maxTss)
                .build());
    }

    @GetMapping("/load-focus")
    public ResponseEntity<LoadFocusDto> getLoadFocus(@RequestParam(defaultValue = "4") int weeks) {
        LoadFocus focus = service.getLoadFocus(weeks);
        return ResponseEntity.ok(LoadFocusDto.builder()
                .lowAerobicPct(focus.getLowAerobicPct())
                .highAerobicPct(focus.getHighAerobicPct())
                .anaerobicPct(focus.getAnaerobicPct())
                .lowAerobicTarget(focus.getLowAerobicTarget())
                .highAerobicTarget(focus.getHighAerobicTarget())
                .anaerobicTarget(focus.getAnaerobicTarget())
                .zoneSeconds(focus.getZoneSeconds())
                .totalSeconds(focus.getTotalSeconds())
                .build());
    }
}
