package pl.strava.analizator.domain.vo;

import pl.strava.analizator.domain.model.Activity;
import java.util.List;

public record ActivityPage(List<Activity> items, long total, int page, int size, int totalPages) {}
