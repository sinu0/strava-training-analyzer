package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import pl.strava.analizator.domain.equipment.Equipment;
import pl.strava.analizator.infrastructure.persistence.entity.EquipmentEntity;

@Mapper(componentModel = "spring")
public interface EquipmentMapper {

    @Mapping(target = "type",
            expression = "java(entity.getType() != null ? pl.strava.analizator.domain.equipment.EquipmentType.valueOf(entity.getType()) : null)")
    @Mapping(target = "status",
            expression = "java(entity.getStatus() != null ? pl.strava.analizator.domain.equipment.EquipmentStatus.valueOf(entity.getStatus()) : null)")
    Equipment toDomain(EquipmentEntity entity);

    @Mapping(target = "type",
            expression = "java(domain.getType() != null ? domain.getType().name() : null)")
    @Mapping(target = "status",
            expression = "java(domain.getStatus() != null ? domain.getStatus().name() : null)")
    EquipmentEntity toEntity(Equipment domain);
}
