package pl.strava.analizator.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.infrastructure.weather.WeatherCacheScheduler;
import pl.strava.analizator.infrastructure.weather.WeatherService;
import pl.strava.analizator.application.dto.WeatherDto;
import pl.strava.analizator.application.dto.WeatherForecastDto;
import pl.strava.analizator.application.dto.WeatherGradientDto;
import pl.strava.analizator.application.dto.WeatherLocationDto;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;
    private final WeatherCacheScheduler cacheScheduler;

    @GetMapping("/current")
    public ResponseEntity<WeatherDto> getCurrentWeather(
            @RequestParam(defaultValue = "50.06") double lat,
            @RequestParam(defaultValue = "19.94") double lon) {
        return ResponseEntity.ok(weatherService.getCurrentWeather(lat, lon));
    }

    @GetMapping("/forecast")
    public ResponseEntity<WeatherForecastDto> getWeatherForecast(
            @RequestParam(defaultValue = "50.06") double lat,
            @RequestParam(defaultValue = "19.94") double lon) {
        return ResponseEntity.ok(weatherService.getWeatherForecast(lat, lon));
    }

    // ===================== GRADIENT (cached data) =====================

    @GetMapping("/gradient")
    public ResponseEntity<WeatherGradientDto> getWeatherGradient(
            @RequestParam String location) {
        return ResponseEntity.ok(weatherService.getWeatherGradient(location));
    }

    @GetMapping("/gradient/point")
    public ResponseEntity<WeatherGradientDto> getWeatherPointGradient(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false) String label) {
        return ResponseEntity.ok(weatherService.getWeatherPointGradient(lat, lon, label));
    }

    @PostMapping("/gradient/refresh")
    public ResponseEntity<Void> refreshGradient(@RequestParam String location) {
        cacheScheduler.refreshLocation(location);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/gradient/refresh-all")
    public ResponseEntity<Void> refreshAllGradients() {
        cacheScheduler.refreshWeatherCache();
        return ResponseEntity.ok().build();
    }

    // ===================== LOCATION MANAGEMENT =====================

    @GetMapping("/locations")
    public ResponseEntity<List<WeatherLocationDto>> getLocations() {
        return ResponseEntity.ok(weatherService.getAllLocations());
    }

    @GetMapping("/locations/active")
    public ResponseEntity<WeatherLocationDto> getActiveLocation() {
        WeatherLocationDto active = weatherService.getActiveLocation();
        if (active == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(active);
    }

    @PostMapping("/locations")
    public ResponseEntity<WeatherLocationDto> addLocation(
            @RequestParam String name,
            @RequestParam double lat,
            @RequestParam double lon) {
        WeatherLocationDto created = weatherService.addLocation(name, lat, lon);
        // Immediately compute cache for the new location
        cacheScheduler.refreshLocation(name);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/locations/{name}")
    public ResponseEntity<Void> deleteLocation(@PathVariable String name) {
        weatherService.deleteLocation(name);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/locations/{name}/activate")
    public ResponseEntity<WeatherLocationDto> activateLocation(@PathVariable String name) {
        return ResponseEntity.ok(weatherService.setActiveLocation(name));
    }
}
