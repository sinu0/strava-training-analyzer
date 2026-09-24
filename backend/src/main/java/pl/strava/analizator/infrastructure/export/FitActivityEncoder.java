package pl.strava.analizator.infrastructure.export;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

import org.springframework.stereotype.Component;

import com.garmin.fit.Activity;
import com.garmin.fit.ActivityMesg;
import com.garmin.fit.BufferEncoder;
import com.garmin.fit.DateTime;
import com.garmin.fit.Event;
import com.garmin.fit.EventMesg;
import com.garmin.fit.EventType;
import com.garmin.fit.File;
import com.garmin.fit.FileIdMesg;
import com.garmin.fit.Fit;
import com.garmin.fit.LapMesg;
import com.garmin.fit.Manufacturer;
import com.garmin.fit.RecordMesg;
import com.garmin.fit.SessionMesg;
import com.garmin.fit.Sport;
import com.garmin.fit.SubSport;

import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.port.ActivityFileEncoder;

/**
 * Indoor cycling activity through Garmin's official FIT SDK:
 * File ID → timer start → records → one lap per workout step → session → timer stop → activity.
 */
@Component
public class FitActivityEncoder implements ActivityFileEncoder {
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public byte[] encode(WorkoutExecution execution, List<RideSample> samples) {
        if (samples.isEmpty()) {
            throw new IllegalArgumentException("FIT activity requires at least one sample");
        }
        RideSample first = samples.get(0);
        RideSample last = samples.get(samples.size() - 1);
        DateTime start = time(first.getAt());
        DateTime end = time(last.getAt());

        BufferEncoder encoder = new BufferEncoder(Fit.ProtocolVersion.V2_0);
        FileIdMesg fileId = new FileIdMesg();
        fileId.setType(File.ACTIVITY);
        fileId.setManufacturer(Manufacturer.DEVELOPMENT);
        fileId.setProduct(1);
        fileId.setTimeCreated(start);
        fileId.setSerialNumber(Integer.toUnsignedLong(RANDOM.nextInt(Integer.MAX_VALUE - 1) + 1));
        encoder.write(fileId);
        encoder.write(timerEvent(start, EventType.START));

        float distance = 0f;
        for (int index = 0; index < samples.size(); index++) {
            RideSample sample = samples.get(index);
            RecordMesg record = new RecordMesg();
            record.setTimestamp(time(sample.getAt()));
            if (sample.getPowerWatts() != null) record.setPower(sample.getPowerWatts());
            if (sample.getHeartRateBpm() != null) record.setHeartRate(sample.getHeartRateBpm().shortValue());
            if (sample.getCadenceRpm() != null) record.setCadence(sample.getCadenceRpm().shortValue());
            if (sample.getSpeedKph() != null) {
                float speed = (float) (sample.getSpeedKph() / 3.6);
                long dtMs = index == 0 ? 1000 : Math.max(0, sample.getElapsedMs() - samples.get(index - 1).getElapsedMs());
                distance += speed * Math.min(dtMs, 5_000) / 1000f;
                record.setSpeed(speed);
                record.setDistance(distance);
            }
            encoder.write(record);
        }

        List<List<RideSample>> laps = splitByStep(samples);
        for (int lapIndex = 0; lapIndex < laps.size(); lapIndex++) {
            encoder.write(lap(lapIndex, laps.get(lapIndex)));
        }

        encoder.write(timerEvent(end, EventType.STOP_ALL));
        float timerSeconds = timerSeconds(samples);
        SessionMesg session = new SessionMesg();
        session.setMessageIndex(0);
        session.setTimestamp(end);
        session.setStartTime(start);
        session.setSport(Sport.CYCLING);
        session.setSubSport(SubSport.INDOOR_CYCLING);
        session.setEvent(Event.SESSION);
        session.setEventType(EventType.STOP);
        session.setFirstLapIndex(0);
        session.setNumLaps(laps.size());
        session.setTotalElapsedTime((float) (end.getTimestamp() - start.getTimestamp() + 1));
        session.setTotalTimerTime(timerSeconds);
        session.setTotalDistance(distance);
        applyTotals(samples, session::setAvgPower, session::setMaxPower, session::setAvgHeartRate, session::setMaxHeartRate, session::setAvgCadence);
        long work = samples.stream().map(RideSample::getPowerWatts).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
        session.setTotalWork(work);
        encoder.write(session);

        ActivityMesg activity = new ActivityMesg();
        activity.setTimestamp(end);
        activity.setTotalTimerTime(timerSeconds);
        activity.setNumSessions(1);
        activity.setType(Activity.MANUAL);
        activity.setEvent(Event.ACTIVITY);
        activity.setEventType(EventType.STOP);
        encoder.write(activity);
        return encoder.close();
    }

    private static LapMesg lap(int index, List<RideSample> samples) {
        RideSample first = samples.get(0);
        RideSample last = samples.get(samples.size() - 1);
        LapMesg lap = new LapMesg();
        lap.setMessageIndex(index);
        lap.setStartTime(time(first.getAt()));
        lap.setTimestamp(time(last.getAt()));
        lap.setEvent(Event.LAP);
        lap.setEventType(EventType.STOP);
        lap.setSport(Sport.CYCLING);
        lap.setTotalElapsedTime((float) (last.getAt().getEpochSecond() - first.getAt().getEpochSecond() + 1));
        lap.setTotalTimerTime(timerSeconds(samples));
        applyTotals(samples, lap::setAvgPower, lap::setMaxPower, lap::setAvgHeartRate, lap::setMaxHeartRate, lap::setAvgCadence);
        return lap;
    }

    private static void applyTotals(
            List<RideSample> samples,
            java.util.function.Consumer<Integer> avgPower, java.util.function.Consumer<Integer> maxPower,
            java.util.function.Consumer<Short> avgHeart, java.util.function.Consumer<Short> maxHeart,
            java.util.function.Consumer<Short> avgCadence) {
        stats(samples, RideSample::getPowerWatts).ifPresent(values -> { avgPower.accept(values[0]); maxPower.accept(values[1]); });
        stats(samples, RideSample::getHeartRateBpm).ifPresent(values -> { avgHeart.accept((short) values[0]); maxHeart.accept((short) values[1]); });
        stats(samples, RideSample::getCadenceRpm).ifPresent(values -> avgCadence.accept((short) values[0]));
    }

    private static java.util.Optional<int[]> stats(List<RideSample> samples, Function<RideSample, Integer> field) {
        var values = samples.stream().map(field).filter(Objects::nonNull).mapToInt(Integer::intValue).summaryStatistics();
        return values.getCount() == 0 ? java.util.Optional.empty()
                : java.util.Optional.of(new int[] {(int) Math.round(values.getAverage()), values.getMax()});
    }

    private static List<List<RideSample>> splitByStep(List<RideSample> samples) {
        List<List<RideSample>> laps = new ArrayList<>();
        List<RideSample> current = new ArrayList<>();
        Integer step = null;
        for (RideSample sample : samples) {
            if (step != null && step != sample.getStepIndex()) {
                laps.add(current);
                current = new ArrayList<>();
            }
            step = sample.getStepIndex();
            current.add(sample);
        }
        laps.add(current);
        return laps;
    }

    /** Recorded seconds (1 Hz): gaps from pauses do not count as riding time. */
    private static float timerSeconds(List<RideSample> samples) {
        return samples.size();
    }

    private static EventMesg timerEvent(DateTime at, EventType type) {
        EventMesg event = new EventMesg();
        event.setTimestamp(at);
        event.setEvent(Event.TIMER);
        event.setEventType(type);
        return event;
    }

    private static DateTime time(Instant instant) {
        return new DateTime(Date.from(instant));
    }
}
