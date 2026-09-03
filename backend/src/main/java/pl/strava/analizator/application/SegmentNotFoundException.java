package pl.strava.analizator.application;

public class SegmentNotFoundException extends RuntimeException {
    public SegmentNotFoundException(String message) { super(message); }
}
