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
public class ActivityStreamsDto {

    private List<String> series;
    private int originalPoints;
    private int returnedPoints;
    private String resolution;
    private int[] time;
    private int[] power;
    private int[] heartrate;
    private int[] cadence;
    private double[] altitude;
    private double[] distance;
    private double[] velocity;
    private double[] latitude;
    private double[] longitude;
}
