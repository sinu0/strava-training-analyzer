package pl.strava.analizator.application;

public class ActivityNotFoundException extends RuntimeException {

    public ActivityNotFoundException(String message) {
        super(message);
    }
}
