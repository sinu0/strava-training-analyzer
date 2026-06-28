package pl.strava.analizator.application;

public interface AutoSyncConfigPort {

    int getIntervalMinutes();

    void setIntervalMinutes(int minutes);
}
