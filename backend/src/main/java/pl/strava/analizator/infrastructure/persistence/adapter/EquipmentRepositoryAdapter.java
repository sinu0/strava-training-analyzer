package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.equipment.Equipment;
import pl.strava.analizator.domain.port.EquipmentRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.EquipmentJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.EquipmentMapper;

@Component
@RequiredArgsConstructor
public class EquipmentRepositoryAdapter implements EquipmentRepository {

    private final EquipmentJpaRepository jpa;
    private final EquipmentMapper mapper;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<Equipment> findAll() {
        return jpa.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Equipment> findById(UUID id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public Equipment save(Equipment equipment) {
        return mapper.toDomain(jpa.save(mapper.toEntity(equipment)));
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }

    @Override
    public void addActivityDistance(UUID equipmentId, UUID activityId, double distanceKm) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO equipment_activity (equipment_id, activity_id, distance_km) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                    equipmentId, activityId, distanceKm);
            jdbcTemplate.update(
                    "UPDATE equipment SET total_km = total_km + ?, updated_at = NOW() WHERE id = ?",
                    distanceKm, equipmentId);
        } catch (Exception e) {
            // non-critical
        }
    }
}
