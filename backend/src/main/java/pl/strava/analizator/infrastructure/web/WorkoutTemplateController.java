package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.WorkoutExportService;
import pl.strava.analizator.application.WorkoutTemplateService;
import pl.strava.analizator.application.dto.WorkoutTemplateDto;

@RestController
@RequestMapping("/api/training/templates")
@RequiredArgsConstructor
public class WorkoutTemplateController {

    private final WorkoutTemplateService templateService;
    private final WorkoutExportService exportService;

    @GetMapping
    public ResponseEntity<List<WorkoutTemplateDto>> getAll(
            @RequestParam(required = false) String category) {
        List<WorkoutTemplateDto> result = category != null
                ? templateService.getByCategory(category)
                : templateService.getAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutTemplateDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(templateService.getById(id));
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<WorkoutTemplateDto> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String category = (String) body.get("category");
        String description = (String) body.get("description");
        BigDecimal targetTss = body.get("targetTss") != null
                ? new BigDecimal(body.get("targetTss").toString()) : null;
        int targetDurationMin = ((Number) body.get("targetDurationMin")).intValue();
        int relativeEffort = body.get("relativeEffort") != null
                ? ((Number) body.get("relativeEffort")).intValue() : 5;
        BigDecimal intensityFactor = body.get("intensityFactor") != null
                ? new BigDecimal(body.get("intensityFactor").toString()) : null;
        List<Map<String, Object>> steps = body.get("steps") != null
                ? (List<Map<String, Object>>) body.get("steps") : List.of();
        String createdBy = (String) body.get("createdBy");

        WorkoutTemplateDto dto = templateService.create(
                name, category, description, targetTss,
                targetDurationMin, relativeEffort, intensityFactor,
                steps, createdBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/export/zwo")
    public ResponseEntity<byte[]> exportZwo(@PathVariable UUID id) {
        byte[] zwo = exportService.exportAsZwo(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"workout.zwo\"")
                .contentType(MediaType.APPLICATION_XML)
                .body(zwo);
    }

    @GetMapping("/{id}/export/fit")
    public ResponseEntity<byte[]> exportFit(@PathVariable UUID id) {
        byte[] fit = exportService.exportAsFit(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"workout.fit\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(fit);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Void> handleNotFound(IllegalArgumentException ex) {
        return ResponseEntity.notFound().build();
    }
}
