package pl.strava.analizator.application.ai;

public class AiModuleDisabledException extends RuntimeException {
    public AiModuleDisabledException(String message) {
        super(message);
    }
}
