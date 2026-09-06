package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.Instant;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.CoachingFeedback;
import pl.strava.analizator.domain.port.CoachingFeedbackRepository;

@Repository @RequiredArgsConstructor
public class CoachingFeedbackRepositoryAdapter implements CoachingFeedbackRepository {
    private final JdbcTemplate jdbc;

    @Override public void save(CoachingFeedback f) {
        jdbc.update("""
            INSERT INTO coaching_feedback(id, source_key, occurred_at, session_type, rpe, quality, completed)
            VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (source_key) DO UPDATE
            SET rpe=EXCLUDED.rpe, quality=EXCLUDED.quality, completed=EXCLUDED.completed
            """, f.getId(), f.getSourceKey(), Timestamp.from(f.getOccurredAt()), f.getSessionType(), f.getRpe(), f.getQuality(), f.isCompleted());
    }

    @Override public List<CoachingFeedback> findBetween(Instant from, Instant to) {
        return jdbc.query("SELECT * FROM coaching_feedback WHERE occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at", (rs, row) -> CoachingFeedback.builder()
                .id(rs.getObject("id", UUID.class)).sourceKey(rs.getString("source_key"))
                .occurredAt(rs.getTimestamp("occurred_at").toInstant()).sessionType(rs.getString("session_type"))
                .rpe((Integer) rs.getObject("rpe")).quality((Double) rs.getObject("quality")).completed(rs.getBoolean("completed")).build(),
                Timestamp.from(from), Timestamp.from(to));
    }
}
