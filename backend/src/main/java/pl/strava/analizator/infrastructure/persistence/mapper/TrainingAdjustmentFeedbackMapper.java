package pl.strava.analizator.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.AdjustmentFeedbackDecision;
import pl.strava.analizator.domain.model.TrainingAdjustmentFeedback;
import pl.strava.analizator.infrastructure.persistence.entity.TrainingAdjustmentFeedbackEntity;

@Component
public class TrainingAdjustmentFeedbackMapper {

    public TrainingAdjustmentFeedback toDomain(TrainingAdjustmentFeedbackEntity entity) {
        return TrainingAdjustmentFeedback.builder()
                .id(entity.getId())
                .date(entity.getDate())
                .planId(entity.getPlanId())
                .suggestionType(entity.getSuggestionType())
                .suggestionTitle(entity.getSuggestionTitle())
                .decision(AdjustmentFeedbackDecision.valueOf(entity.getFeedback()))
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public TrainingAdjustmentFeedbackEntity toEntity(TrainingAdjustmentFeedback domain) {
        return TrainingAdjustmentFeedbackEntity.builder()
                .id(domain.getId())
                .date(domain.getDate())
                .planId(domain.getPlanId())
                .suggestionType(domain.getSuggestionType())
                .suggestionTitle(domain.getSuggestionTitle())
                .feedback(domain.getDecision().name())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
