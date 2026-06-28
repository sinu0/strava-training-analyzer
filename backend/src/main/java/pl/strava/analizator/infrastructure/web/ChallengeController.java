package pl.strava.analizator.infrastructure.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ChallengeService;
import pl.strava.analizator.application.dto.ChallengeDto;
import pl.strava.analizator.application.dto.SaveChallengeRequest;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping
    public ResponseEntity<List<ChallengeDto>> getAll() {
        return ResponseEntity.ok(challengeService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChallengeDto>> getActive() {
        return ResponseEntity.ok(challengeService.getActiveChallenges());
    }

    @GetMapping("/templates")
    public ResponseEntity<List<Map<String, Object>>> getTemplates() {
        return ResponseEntity.ok(challengeService.getTemplates());
    }

    @PostMapping
    public ResponseEntity<ChallengeDto> create(@Valid @RequestBody SaveChallengeRequest request) {
        return ResponseEntity.ok(challengeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChallengeDto> update(@PathVariable UUID id, @Valid @RequestBody SaveChallengeRequest request) {
        var dto = challengeService.update(id, request);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        challengeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
