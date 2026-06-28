package pl.strava.analizator.domain.ai;

import java.time.OffsetDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class KnowledgeDocument {

    private final String id;
    private final KnowledgeSource source;
    private final String url;
    private final String title;
    private final KnowledgeType type;
    private final List<String> topics;
    private final String content;
    private final int chunkIndex;
    private final OffsetDateTime embeddedAt;
    private final OffsetDateTime refreshedAt;
}
