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
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.EquipmentService;
import pl.strava.analizator.application.dto.EquipmentDto;
import pl.strava.analizator.application.dto.SaveEquipmentRequest;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<List<EquipmentDto>> getAll() {
        return ResponseEntity.ok(equipmentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentDto> getById(@PathVariable UUID id) {
        var dto = equipmentService.getById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<EquipmentDto>> getAlerts() {
        return ResponseEntity.ok(equipmentService.getMaintenanceAlerts());
    }

    @PostMapping
    public ResponseEntity<EquipmentDto> create(@Valid @RequestBody SaveEquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentDto> update(@PathVariable UUID id, @Valid @RequestBody SaveEquipmentRequest request) {
        var dto = equipmentService.update(id, request);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        equipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
