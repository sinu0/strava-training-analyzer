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
    @Mapping(target = "tags",
            expression = "java(entity.getTags() != null ? java.util.Arrays.asList(entity.getTags()) : java.util.List.of())")
    JournalEntry toDomain(JournalEntryEntity entity);

    @Mapping(target = "mood",
            expression = "java(domain.getMood() != null ? domain.getMood().name() : null)")
    @Mapping(target = "tags",
            expression = "java(domain.getTags() != null ? domain.getTags().toArray(new String[0]) : null)")
    JournalEntryEntity toEntity(JournalEntry domain);
}
