package pl.strava.analizator.infrastructure.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.CustomPromptService;
import pl.strava.analizator.application.dto.CustomPromptDto;

@RestController
@RequestMapping("/api/ai/prompts")
@RequiredArgsConstructor
public class AiCustomPromptController {

    private final CustomPromptService customPromptService;

    @GetMapping
    public ResponseEntity<List<CustomPromptDto>> getAll(
            @RequestParam(required = false) String type) {
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(customPromptService.getByType(type));
        }
        return ResponseEntity.ok(customPromptService.getAll());
    }

    @PostMapping
    public ResponseEntity<CustomPromptDto> save(@RequestBody CustomPromptDto dto) {
        return ResponseEntity.ok(customPromptService.save(dto));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<CustomPromptDto> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(customPromptService.activate(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<CustomPromptDto> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(customPromptService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        customPromptService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
