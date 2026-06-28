package pl.strava.analizator.infrastructure.persistence.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import pl.strava.analizator.domain.journal.JournalEntry;
import pl.strava.analizator.domain.journal.JournalMood;
import pl.strava.analizator.infrastructure.persistence.entity.JournalEntryEntity;

@Mapper(componentModel = "spring")
public interface JournalEntryMapper {

    @Mapping(target = "mood",
            expression = "java(entity.getMood() != null ? pl.strava.analizator.domain.journal.JournalMood.valueOf(entity.getMood()) : null)")
    JournalEntry toDomain(JournalEntryEntity entity);

    @Mapping(target = "mood",
            expression = "java(domain.getMood() != null ? domain.getMood().name() : null)")
    JournalEntryEntity toEntity(JournalEntry domain);
}
