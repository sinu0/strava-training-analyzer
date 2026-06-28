package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.equipment.Equipment;
import pl.strava.analizator.domain.equipment.EquipmentStatus;
import pl.strava.analizator.domain.equipment.EquipmentType;
import pl.strava.analizator.domain.port.EquipmentRepository;
import pl.strava.analizator.application.dto.EquipmentDto;
import pl.strava.analizator.application.dto.SaveEquipmentRequest;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public List<EquipmentDto> getAll() {
        return equipmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Equipment::getTotalKm).reversed())
                .map(this::toDto)
                .toList();
    }

    public EquipmentDto getById(UUID id) {
        return equipmentRepository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional
    public EquipmentDto save(SaveEquipmentRequest request) {
        EquipmentType type = EquipmentType.valueOf(request.getType().toUpperCase());
        Instant now = Instant.now();

        Equipment equipment = Equipment.builder()
                .name(request.getName())
                .type(type)
                .brand(request.getBrand())
                .model(request.getModel())
                .purchaseDate(request.getPurchaseDate())
                .purchasePrice(request.getPurchasePrice())
                .replacementIntervalKm(request.getReplacementIntervalKm())
                .totalKm(request.getTotalKm() != null ? request.getTotalKm() : 0)
                .status(EquipmentStatus.ACTIVE)
                .notes(request.getNotes())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toDto(equipmentRepository.save(equipment));
    }

    @Transactional
    public EquipmentDto update(UUID id, SaveEquipmentRequest request) {
        var existing = equipmentRepository.findById(id).orElse(null);
        if (existing == null) return null;

        EquipmentType type = EquipmentType.valueOf(request.getType().toUpperCase());

        Equipment updated = Equipment.builder()
                .id(id)
                .name(request.getName())
                .type(type)
                .brand(request.getBrand())
                .model(request.getModel())
                .purchaseDate(request.getPurchaseDate())
                .purchasePrice(request.getPurchasePrice())
                .replacementIntervalKm(request.getReplacementIntervalKm())
                .totalKm(request.getTotalKm() != null ? request.getTotalKm() : existing.getTotalKm())
                .status(existing.getStatus())
                .notes(request.getNotes())
                .createdAt(existing.getCreatedAt())
                .updatedAt(Instant.now())
                .build();

        return toDto(equipmentRepository.save(updated));
    }

    @Transactional
    public void delete(UUID id) {
        equipmentRepository.deleteById(id);
    }

    public List<EquipmentDto> getMaintenanceAlerts() {
        return equipmentRepository.findAll().stream()
                .filter(e -> e.getReplacementIntervalKm() != null && e.getReplacementIntervalKm() > 0)
                .filter(e -> e.getTotalKm() > e.getReplacementIntervalKm() * 0.8)
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .map(this::toDto)
                .toList();
    }

    private EquipmentDto toDto(Equipment e) {
        double usagePercent = e.getReplacementIntervalKm() != null && e.getReplacementIntervalKm() > 0
                ? Math.round(e.getTotalKm() / e.getReplacementIntervalKm() * 1000.0) / 10.0
                : 0;

        return EquipmentDto.builder()
                .id(e.getId())
                .name(e.getName())
                .type(e.getType() != null ? e.getType().name() : null)
                .brand(e.getBrand())
                .model(e.getModel())
                .purchaseDate(e.getPurchaseDate())
                .purchasePrice(e.getPurchasePrice())
                .replacementIntervalKm(e.getReplacementIntervalKm())
                .totalKm(e.getTotalKm())
                .usagePercent(usagePercent)
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
