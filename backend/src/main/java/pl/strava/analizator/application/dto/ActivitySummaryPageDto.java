package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivitySummaryPageDto {
    private List<ActivitySummaryDto> items;
    private long total;
    private int page;
    private int size;
    private int totalPages;
}
