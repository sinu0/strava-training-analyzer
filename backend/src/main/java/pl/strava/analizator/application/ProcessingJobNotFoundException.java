package pl.strava.analizator.application;

public class ProcessingJobNotFoundException extends RuntimeException {

    public ProcessingJobNotFoundException(String message) {
        super(message);
    }
}
