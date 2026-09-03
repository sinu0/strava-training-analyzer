package pl.strava.analizator.domain.model;

import java.util.UUID;

public record ActivitySegmentStats(UUID activityId, int segmentCount, int newRecordCount) {}
