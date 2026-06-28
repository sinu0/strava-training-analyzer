package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.challenge.Challenge;
import pl.strava.analizator.domain.port.ChallengeRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.ChallengeJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.ChallengeMapper;

@Component
@RequiredArgsConstructor
public class ChallengeRepositoryAdapter implements ChallengeRepository {

    private final ChallengeJpaRepository jpa;
    private final ChallengeMapper mapper;
    private final JdbcTemplate jdbc;

    @Override
    public List<Challenge> findAll() {
        return jpa.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Challenge> findByStatus(String status) {
        return jpa.findByStatus(status).stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Challenge> findById(UUID id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public Challenge save(Challenge challenge) {
        return mapper.toDomain(jpa.save(mapper.toEntity(challenge)));
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }

    @Override
    public void updateProgress(UUID challengeId, double value) {
        try {
            jdbc.update(
                    "INSERT INTO challenge_progress (challenge_id, current_value, last_updated) VALUES (?, ?, NOW()) " +
                    "ON CONFLICT (challenge_id) DO UPDATE SET current_value = ?, last_updated = NOW()",
                    challengeId, value, value);
        } catch (Exception ignored) {
        }
    }
}
