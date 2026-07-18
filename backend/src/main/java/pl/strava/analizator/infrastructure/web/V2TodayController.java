package pl.strava.analizator.infrastructure.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.V2TodayService;
import pl.strava.analizator.application.dto.TodayDto;

@RestController
@RequestMapping("/api/v2")
@RequiredArgsConstructor
public class V2TodayController {

    private final V2TodayService todayService;

    @GetMapping("/today")
    public TodayDto getToday() {
        return todayService.getToday();
    }
}
