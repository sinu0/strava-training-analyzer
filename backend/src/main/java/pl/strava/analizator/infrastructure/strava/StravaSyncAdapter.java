package pl.strava.analizator.infrastructure.strava;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.SyncDataSource;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.ActivityDataSource;
import pl.strava.analizator.infrastructure.strava.dto.StravaActivityDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaActivityPhotoDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaStreamDto;

@Component
@RequiredArgsConstructor
public class StravaSyncAdapter implements ActivityDataSource, SyncDataSource {

    private final StravaApiClient stravaApiClient;
    private final StravaActivityMapper activityMapper;

    private AthleteProfile currentProfile;

    public void setProfile(AthleteProfile profile) {
        this.currentProfile = profile;
    }

    @Override
    public String sourceName() {
        return "strava";
    }

    @Override
    public List<Activity> fetchActivities(OffsetDateTime after, int perPage) {
        requireProfile();
        Long afterEpoch = after != null ? after.toEpochSecond() : null;
        List<StravaActivityDto> dtos = stravaApiClient.getActivities(currentProfile, 1, afterEpoch);
        return dtos.stream()
                .map(dto -> activityMapper.toDomain(dto, List.of(), List.of()))
                .toList();
    }

    @Override
    public Activity fetchActivityDetail(String externalId) {
        requireProfile();
        StravaActivityDto detail = stravaApiClient.getActivityDetail(currentProfile, externalId);
        List<StravaStreamDto> streams = stravaApiClient.getActivityStreams(currentProfile, externalId);
        List<String> photoUrls = stravaApiClient.getActivityPhotos(currentProfile, externalId).stream()
                .map(StravaActivityPhotoDto::bestUrl)
                .filter(url -> url != null && !url.isBlank())
                .toList();
        return activityMapper.toDomain(detail, streams, photoUrls);
    }

    @Override
    public int[] fetchPowerStream(String externalId) {
        requireProfile();
        List<StravaStreamDto> streams = stravaApiClient.getActivityStreams(currentProfile, externalId);
        return streams.stream()
                .filter(s -> "watts".equals(s.getType()))
                .findFirst()
                .map(s -> s.getData().stream().mapToInt(v -> v instanceof Number n ? n.intValue() : 0).toArray())
                .orElse(new int[0]);
    }

    @Override
    public int[] fetchHeartrateStream(String externalId) {
        requireProfile();
        List<StravaStreamDto> streams = stravaApiClient.getActivityStreams(currentProfile, externalId);
        return streams.stream()
                .filter(s -> "heartrate".equals(s.getType()))
                .findFirst()
                .map(s -> s.getData().stream().mapToInt(v -> v instanceof Number n ? n.intValue() : 0).toArray())
                .orElse(new int[0]);
    }

    public List<Activity> fetchAllActivities(AthleteProfile profile, Long afterEpoch) {
        setProfile(profile);
        List<StravaActivityDto> dtos = stravaApiClient.getActivities(profile, 1, afterEpoch);
        return dtos.stream()
                .map(dto -> activityMapper.toDomain(dto, List.of(), List.of()))
                .toList();
    }

    @Override
    public List<Activity> fetchActivitiesPage(AthleteProfile profile, int page, Long afterEpoch) {
        setProfile(profile);
        List<StravaActivityDto> dtos = stravaApiClient.getActivities(profile, page, afterEpoch);
        return dtos.stream()
                .map(dto -> activityMapper.toDomain(dto, List.of(), List.of()))
                .toList();
    }

    @Override
    public Activity fetchActivityWithStreams(AthleteProfile profile, String externalId) {
        setProfile(profile);
        return fetchActivityDetail(externalId);
    }

    @Override
    public List<String> fetchActivityPhotoUrls(AthleteProfile profile, String externalId) {
        setProfile(profile);
        return stravaApiClient.getActivityPhotos(profile, externalId).stream()
                .map(StravaActivityPhotoDto::bestUrl)
                .filter(url -> url != null && !url.isBlank())
                .toList();
    }

    @Override
    public int countNewActivities(AthleteProfile profile, long afterEpoch) {
        setProfile(profile);
        List<StravaActivityDto> dtos = stravaApiClient.getActivities(profile, 1, afterEpoch, 100);
        return dtos.size();
    }

    private void requireProfile() {
        if (currentProfile == null) {
            throw new IllegalStateException("AthleteProfile not set. Call setProfile() first.");
        }
    }
}
