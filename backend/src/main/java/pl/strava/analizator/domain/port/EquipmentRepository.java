package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.equipment.Equipment;

public interface EquipmentRepository {

    List<Equipment> findAll();

    Optional<Equipment> findById(UUID id);

    Equipment save(Equipment equipment);

    void deleteById(UUID id);

    void addActivityDistance(UUID equipmentId, UUID activityId, double distanceKm);
}
