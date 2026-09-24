package pl.strava.analizator.application;

public class RideRecordingNotFoundException extends RuntimeException {
    public RideRecordingNotFoundException(String message) {
        super(message);
    }
}
